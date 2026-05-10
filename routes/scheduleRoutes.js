const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController/index');
const scheduleImportExport = require('../controllers/scheduleImportExport/index');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.post('/', protect, checkRole(['admin']), scheduleController.createSchedule);
router.get('/', protect, scheduleController.getAllSchedules);
router.get('/current-week', protect, scheduleController.getCurrentAcademicInfo);
router.get('/week-dates/:semester/:week', protect, scheduleController.getWeekDates);
router.get('/teacher/:teacherId', protect, checkRole(['teacher', 'admin']), scheduleController.getTeacherSchedule);
router.get('/class/:classId', protect, scheduleController.getScheduleByClass);
router.get('/student/:studentId/lesson/:subject/:date', protect, scheduleController.getStudentLessonDetails);
router.get('/day/:dayOfWeek', protect, scheduleController.getScheduleByDay);
router.get('/with-events/:userId/:date', protect, scheduleController.getScheduleWithEvents);

// import/export before /:id — otherwise "export" is parsed as :id
router.get('/export-template', protect, checkRole(['admin']), scheduleImportExport.getImportTemplate);
router.get('/export/:classId', protect, checkRole(['admin', 'teacher']), scheduleImportExport.exportSchedule);
router.post('/import', protect, checkRole(['admin']), scheduleImportExport.importSchedule);

router.get('/:id', protect, scheduleController.getScheduleById);
router.put('/:id', protect, checkRole(['admin']), scheduleController.updateSchedule);
router.delete('/:id', protect, checkRole(['admin']), scheduleController.deleteSchedule);

module.exports = router;
