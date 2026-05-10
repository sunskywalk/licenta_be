const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController/index');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, classController.createClass);
router.get('/', protect, classController.getAllClasses);
router.get('/:id', protect, classController.getClassById);
router.get('/:id/stats', protect, classController.getClassWithStats);
router.put('/:id', protect, classController.updateClass);
router.delete('/:id', protect, classController.deleteClass);
router.put('/:id/homeroom-teacher', protect, classController.assignHomeroomTeacher);

router.post('/students/add', protect, classController.addStudentToClass);
router.post('/students/remove', protect, classController.removeStudentFromClass);
router.get('/students/available', protect, classController.getAvailableStudents);

router.get('/data/teachers', protect, classController.getAllTeachers);
router.get('/data/students', protect, classController.getAllStudentsForClass);
router.get('/data/subjects', protect, classController.getSubjectsList);

module.exports = router;
