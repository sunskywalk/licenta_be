// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Логин - публично
router.post('/login', userController.loginUser);

// Регистрация (admin)
router.post('/register', protect, userController.registerUser);

// Список пользователей (admin)
router.get('/', protect, userController.getAllUsers);

// Получить админов (для отправки уведомлений поддержки)
router.get('/admins', protect, userController.getAdminUsers);

// Получить 1
router.get('/:id', protect, userController.getUserById);

// Обновить
router.put('/:id', protect, userController.updateUser);

// Удалить
router.delete('/:id', protect, userController.deleteUser);

module.exports = router;