// routes/classRoutes.js
const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');

// Создать класс
router.post('/', protect, classController.createClass);
// Получить все
router.get('/', protect, classController.getAllClasses);
// Получить по ID
router.get('/:id', protect, classController.getClassById);
// Обновить
router.put('/:id', protect, classController.updateClass);
// Удалить
router.delete('/:id', protect, classController.deleteClass);

module.exports = router;