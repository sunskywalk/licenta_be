// routes/homeworkRoutes.js
const express = require('express');
const router = express.Router();
// Use explicit /index — avoids resolving a same-named file instead of this folder (Node quirk)
const homeworkController = require('../controllers/homeworkController/index');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, homeworkController.createHomework);
router.get('/', protect, homeworkController.getAllHomeworks);
router.get('/:id', protect, homeworkController.getHomeworkById);
router.put('/:id', protect, homeworkController.updateHomework);
router.delete('/:id', protect, homeworkController.deleteHomework);

router.get('/classroom/:classroomId', protect, homeworkController.getHomeworkByClassroom);
router.get('/student/:studentId', protect, homeworkController.getHomeworkByStudent);
router.get('/teacher/:teacherId', protect, homeworkController.getHomeworkByTeacher);

module.exports = router;