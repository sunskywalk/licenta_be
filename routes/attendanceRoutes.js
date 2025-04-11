// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, attendanceController.createAttendance);
router.get('/', protect, attendanceController.getAllAttendance);
router.get('/:id', protect, attendanceController.getAttendanceById);
router.put('/:id', protect, attendanceController.updateAttendance);
router.delete('/:id', protect, attendanceController.deleteAttendance);

module.exports = router;