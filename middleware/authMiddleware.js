// JWT guard: Bearer token → req.user { userId, role }; 401/403 on failure

const jwt = require('jsonwebtoken');

const MESSAGES = {
  TOKEN_REQUIRED: 'Необходим токен для доступа',
  TOKEN_INVALID: 'Неверный или просроченный токен',
  ROLE_UNDEFINED: 'Доступ запрещён: роль не определена',
  ADMIN_ONLY: 'Доступ только для администраторов',
};

function roleRequiredMessage(allowedRoles) {
  return `Доступ запрещён: требуется роль ${allowedRoles.join(' или ')}`;
}

/** pull token from Authorization header, or null */
function extractBearerToken(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.split(' ')[1];
}

exports.protect = (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: MESSAGES.TOKEN_REQUIRED });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    return next();
  } catch (err) {
    console.error('[protect] JWT verify error:', err.message);
    return res.status(401).json({ message: MESSAGES.TOKEN_INVALID });
  }
};

exports.checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: MESSAGES.ROLE_UNDEFINED });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: roleRequiredMessage(allowedRoles),
      });
    }
    return next();
  };
};

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: MESSAGES.ADMIN_ONLY });
  }
  return next();
};
