const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController/index');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, homeworkController.createHomework);
router.get('/', protect, homeworkController.getAllHomeworks);

router.get('/classroom/:classroomId', protect, homeworkController.getHomeworkByClassroom);
router.get('/student/:studentId', protect, homeworkController.getHomeworkByStudent);
router.get('/teacher/:teacherId', protect, homeworkController.getHomeworkByTeacher);

router.get('/:id', protect, homeworkController.getHomeworkById);
router.put('/:id', protect, homeworkController.updateHomework);
router.delete('/:id', protect, homeworkController.deleteHomework);

module.exports = router;
