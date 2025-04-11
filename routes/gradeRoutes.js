// routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { protect } = require('../middleware/authMiddleware');

// CRUD
router.post('/', protect, gradeController.createGrade);
router.get('/', protect, gradeController.getAllGrades);
router.get('/:id', protect, gradeController.getGradeById);
router.put('/:id', protect, gradeController.updateGrade);
router.delete('/:id', protect, gradeController.deleteGrade);

// Методы для расчётов
router.get('/student/:studentId/average', protect, gradeController.getStudentAverage);
router.get('/student/:studentId/final', protect, gradeController.getFinalAverage);

module.exports = router;