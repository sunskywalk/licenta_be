const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController/index');
const { protect } = require('../middleware/authMiddleware');
const { homeworkUploadMiddleware } = require('../middleware/homeworkUpload');

router.post('/', protect, (req, res, next) => {
  homeworkUploadMiddleware(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Файл слишком большой (максимум 10 МБ)' });
      }
      return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    }
    next();
  });
}, homeworkController.createHomework);
router.get('/', protect, homeworkController.getAllHomeworks);

router.get('/classroom/:classroomId', protect, homeworkController.getHomeworkByClassroom);
router.get('/student/:studentId', protect, homeworkController.getHomeworkByStudent);
router.get('/teacher/:teacherId', protect, homeworkController.getHomeworkByTeacher);

router.get('/:id', protect, homeworkController.getHomeworkById);
router.put('/:id', protect, homeworkController.updateHomework);
router.delete('/:id', protect, homeworkController.deleteHomework);

module.exports = router;
