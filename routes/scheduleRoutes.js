// routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

// создать расписание (admin)
router.post('/', protect, scheduleController.createSchedule);

// получить все
router.get('/', protect, scheduleController.getAllSchedules);

// получить одно
router.get('/:id', protect, scheduleController.getScheduleById);

// обновить (admin)
router.put('/:id', protect, scheduleController.updateSchedule);

// удалить (admin)
router.delete('/:id', protect, scheduleController.deleteSchedule);

module.exports = router;