// routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { protect } = require('../middleware/authMiddleware');

// Методы для получения предметов и классов учителя (ДОЛЖНЫ БЫТЬ ПЕРВЫМИ!)
router.get('/my-subjects', protect, gradeController.getTeacherSubjects);
router.get('/my-subjects/:subject/classes', protect, gradeController.getClassroomsForSubject);

// Методы для расчётов
router.get('/student/:studentId/average', protect, gradeController.getStudentAverage);
router.get('/student/:studentId/final', protect, gradeController.getFinalAverage);

// CRUD
router.post('/', protect, gradeController.createGrade);
router.get('/', protect, gradeController.getAllGrades);
router.get('/:id', protect, gradeController.getGradeById);
router.put('/:id', protect, gradeController.updateGrade);
router.delete('/:id', protect, gradeController.deleteGrade);

// Методы для учителя
router.get('/teacher/:teacherId', protect, gradeController.getTeacherGrades);

// Методы для студента
router.get('/student/:studentId', protect, gradeController.getStudentGrades);

// Методы для класса
router.get('/class/:classId', protect, gradeController.getGradesByClass);

module.exports = router;