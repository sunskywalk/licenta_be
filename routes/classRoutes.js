const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController/index');
const { protect } = require('../middleware/authMiddleware');

// Admin creates a class.
router.post('/', protect, classController.createClass);

// List classes.
router.get('/', protect, classController.getAllClasses);

// Get one class.
router.get('/:id', protect, classController.getClassById);

// Get class stats.
router.get('/:id/stats', protect, classController.getClassWithStats);

// Admin updates a class.
router.put('/:id', protect, classController.updateClass);

// Admin deletes a class.
router.delete('/:id', protect, classController.deleteClass);

// Admin sets the homeroom teacher.
router.put('/:id/homeroom-teacher', protect, classController.assignHomeroomTeacher);

// Move students between classes.
router.post('/students/add', protect, classController.addStudentToClass);
router.post('/students/remove', protect, classController.removeStudentFromClass);
router.get('/students/available', protect, classController.getAvailableStudents);

// Data needed by class forms.
router.get('/data/teachers', protect, classController.getAllTeachers);
router.get('/data/students', protect, classController.getAllStudentsForClass);
router.get('/data/subjects', protect, classController.getSubjectsList);

module.exports = router;