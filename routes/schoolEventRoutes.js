const express = require('express');
const router = express.Router();
const schoolEventController = require('../controllers/schoolEventController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET routes - available for all authenticated users (students/teachers need to see events)
router.get('/', protect, schoolEventController.getAllSchoolEvents);
router.get('/date/:date', protect, schoolEventController.getEventsForDate);
router.get('/range', protect, schoolEventController.getEventsInRange);

// CUD routes - admin only
router.post('/', protect, adminOnly, schoolEventController.createSchoolEvent);
router.put('/:id', protect, adminOnly, schoolEventController.updateSchoolEvent);
router.delete('/:id', protect, adminOnly, schoolEventController.deleteSchoolEvent);

module.exports = router;
