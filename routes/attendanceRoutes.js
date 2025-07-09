// routes/attendanceRoutes.js
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
  getStudentAttendanceWithGrades
} = require('../controllers/attendanceController');
const { protect, checkRole } = require('../middleware/authMiddleware');

// Public routes (if any)

// Protected routes
router.use(protect);

router.route('/')
  .get(protect, checkRole(['admin', 'teacher']), getAllAttendance) 
  .post(protect, checkRole(['teacher']), createAttendance);

router.post('/mark', protect, checkRole(['teacher']), markAttendance);
router.post('/bulk', protect, checkRole(['teacher', 'admin']), createBulkAttendance);

router.get('/class/:classId/date/:date', protect, checkRole(['teacher']), getAttendanceByClassAndDate);
router.get('/class/:classId', protect, checkRole(['teacher', 'admin']), getAttendanceByClass);
router.get('/class/:classId/stats', protect, checkRole(['teacher', 'admin']), getClassAttendanceStats);

router.get('/date/:date', protect, checkRole(['teacher', 'admin']), getAttendanceByDate);

router.get('/student/:studentId', protect, checkRole(['student', 'teacher', 'admin']), getStudentAttendance);
router.get('/student/:studentId/with-grades', protect, checkRole(['student', 'teacher', 'admin']), getStudentAttendanceWithGrades);
router.get('/student/:studentId/stats', protect, checkRole(['student', 'teacher', 'admin']), getStudentAttendanceStats);
router.get('/teacher/:teacherId', protect, checkRole(['teacher', 'admin']), getTeacherAttendance);

router.route('/:id')
  .get(protect, checkRole(['student', 'teacher', 'admin']), getAttendanceById)
  .put(protect, checkRole(['teacher']), updateAttendance)
  .delete(protect, checkRole(['admin']), deleteAttendance);

module.exports = router;