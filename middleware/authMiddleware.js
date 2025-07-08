/**
 * JWT-middleware: проверяет наличие и валидность токена.
 * ------------------------------------------------------
 *  - Authorization: Bearer <token>
 *  - После валидации кладёт payload в req.user
 *  - В случае ошибки возвращает 401 / 403
 */

const jwt = require('jsonwebtoken');

/**
 * Защита любого роут-хендлера.
 * Используется так:  app.use('/api/private', protect, privateRouter);
 */
exports.protect = (req, res, next) => {
  let token;

  // 1. Достаём токен из заголовка Authorization
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]; // "Bearer <token>" → <token>
  }

  // 2. Если токена нет — 401
  if (!token) {
    return res.status(401).json({ message: 'Необходим токен для доступа' });
  }

  try {
    // 3. Проверяем подпись и срок действия
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // { userId, role, iat, exp }

    // 4. Кладём полезные поля в req.user
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    console.log('[protect] userId:', req.user.userId, 'role:', req.user.role);

    return next();
  } catch (err) {
    console.error('[protect] JWT verify error:', err.message);
    return res.status(401).json({ message: 'Неверный или просроченный токен' });
  }
};

/**
 * Ограничение по ролям.
 * Пример: router.post('/admin', protect, checkRole(['admin']), adminController);
 */
exports.checkRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Недостаточно прав' });
  }
  return next();
};

/**
 * Middleware только для админов.
 * Пример: router.get('/stats', protect, adminOnly, statsController);
 */
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ только для администраторов' });
  }
  return next();
};