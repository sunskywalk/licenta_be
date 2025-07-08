// routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, checkRole } = require('../middleware/authMiddleware');

// создать расписание (admin)
router.post('/', protect, checkRole(['admin']), scheduleController.createSchedule);

// получить все
router.get('/', protect, scheduleController.getAllSchedules);

// получить расписание для конкретного учителя
router.get('/teacher/:teacherId', protect, checkRole(['teacher', 'admin']), scheduleController.getTeacherSchedule);

// получить расписание для конкретного класса
router.get('/class/:classId', protect, scheduleController.getScheduleByClass);

// получить расписание для конкретного дня недели
router.get('/day/:dayOfWeek', protect, scheduleController.getScheduleByDay);

// получить одно
router.get('/:id', protect, scheduleController.getScheduleById);

// обновить (admin)
router.put('/:id', protect, checkRole(['admin']), scheduleController.updateSchedule);

// удалить (admin)
router.delete('/:id', protect, checkRole(['admin']), scheduleController.deleteSchedule);

module.exports = router;