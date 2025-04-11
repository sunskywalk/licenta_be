// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Регистрация (admin)
router.post('/register', protect, userController.registerUser);

router.post('/test-register', userController.registerUser); // без protect
// Логин (публичный)
router.post('/login', userController.loginUser);

// Получить всех пользователей (admin)
router.get('/', protect, userController.getAllUsers);

// Получить одного
router.get('/:id', protect, userController.getUserById);

// Обновить
router.put('/:id', protect, userController.updateUser);

// Удалить
router.delete('/:id', protect, userController.deleteUser);

module.exports = router;