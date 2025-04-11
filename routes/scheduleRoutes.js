// routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, scheduleController.createSchedule);
router.get('/', protect, scheduleController.getAllSchedules);
router.get('/:id', protect, scheduleController.getScheduleById);
router.put('/:id', protect, scheduleController.updateSchedule);
router.delete('/:id', protect, scheduleController.deleteSchedule);

module.exports = router;