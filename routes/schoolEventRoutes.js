const express = require('express');
const router = express.Router();
const schoolEventController = require('../controllers/schoolEventController/index');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, schoolEventController.getAllSchoolEvents);
router.get('/date/:date', protect, schoolEventController.getEventsForDate);
router.get('/range', protect, schoolEventController.getEventsInRange);

router.post('/', protect, adminOnly, schoolEventController.createSchoolEvent);
router.put('/:id', protect, adminOnly, schoolEventController.updateSchoolEvent);
router.delete('/:id', protect, adminOnly, schoolEventController.deleteSchoolEvent);

module.exports = router;
