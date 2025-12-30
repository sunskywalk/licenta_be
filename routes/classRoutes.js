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

// Получить класс с детальной статистикой (admin)
router.get('/:id/stats', protect, classController.getClassWithStats);

// Обновить (admin)
router.put('/:id', protect, classController.updateClass);

// Удалить (admin)
router.delete('/:id', protect, classController.deleteClass);

// Назначить классного руководителя (admin)
router.put('/:id/homeroom-teacher', protect, classController.assignHomeroomTeacher);

// Управление учениками в классах
router.post('/students/add', protect, classController.addStudentToClass);
router.post('/students/remove', protect, classController.removeStudentFromClass);
router.get('/students/available', protect, classController.getAvailableStudents);

// Получение данных для создания класса
router.get('/data/teachers', protect, classController.getAllTeachers);
router.get('/data/students', protect, classController.getAllStudentsForClass);
router.get('/data/subjects', protect, classController.getSubjectsList);

module.exports = router;