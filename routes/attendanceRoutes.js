const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getStudentAttendance,
  getAttendanceByClassAndDate,
  markAttendance,
  getStudentAttendanceStats,
  getTeacherAttendance,
  getClassAttendanceStats,
  getAttendanceByClass,
  getAttendanceByDate,
  createBulkAttendance,
  getStudentAttendanceWithGrades,
} = require('../controllers/attendanceController/index');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(checkRole(['admin', 'teacher']), getAllAttendance)
  .post(checkRole(['teacher']), createAttendance);

router.post('/mark', checkRole(['teacher']), markAttendance);
router.post('/bulk', checkRole(['teacher', 'admin']), createBulkAttendance);

router.get('/class/:classId/date/:date', checkRole(['teacher']), getAttendanceByClassAndDate);
router.get('/class/:classId', checkRole(['teacher', 'admin']), getAttendanceByClass);
router.get('/class/:classId/stats', checkRole(['teacher', 'admin']), getClassAttendanceStats);

router.get('/date/:date', checkRole(['teacher', 'admin']), getAttendanceByDate);

router.get('/student/:studentId', checkRole(['student', 'teacher', 'admin']), getStudentAttendance);
router.get('/student/:studentId/with-grades', checkRole(['student', 'teacher', 'admin']), getStudentAttendanceWithGrades);
router.get('/student/:studentId/stats', checkRole(['student', 'teacher', 'admin']), getStudentAttendanceStats);
router.get('/teacher/:teacherId', checkRole(['teacher', 'admin']), getTeacherAttendance);

router.route('/:id')
  .get(checkRole(['student', 'teacher', 'admin']), getAttendanceById)
  .put(checkRole(['teacher']), updateAttendance)
  .delete(checkRole(['admin']), deleteAttendance);

module.exports = router;
