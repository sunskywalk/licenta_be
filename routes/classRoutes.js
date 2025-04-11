// routes/classRoutes.js
const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');

// Создать класс (admin)
router.post('/', protect, classController.createClass);

// Получить все
router.get('/', protect, classController.getAllClasses);

// Получить 1
router.get('/:id', protect, classController.getClassById);

// Обновить (admin)
router.put('/:id', protect, classController.updateClass);

// Удалить (admin)
router.delete('/:id', protect, classController.deleteClass);

module.exports = router;