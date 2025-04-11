// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Проверка JWT
exports.protect = (req, res, next) => {
  let token = null;
  console.log('=== PROTECT ===');
  console.log('TOKEN:', token);
  console.log('DECODED:', decoded);
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Необходим токен для доступа' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { userId, role, iat, exp }
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Неверный токен' });
  }
};

// Проверка роли (можно указать массив ролей)
exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    next();
  };
  
};