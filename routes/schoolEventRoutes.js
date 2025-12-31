const express = require('express');
const router = express.Router();
const schoolEventController = require('../controllers/schoolEventController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// CRUD routes
router.post('/', schoolEventController.createSchoolEvent);
router.get('/', schoolEventController.getAllSchoolEvents);
router.get('/date/:date', schoolEventController.getEventsForDate);
router.get('/range', schoolEventController.getEventsInRange);
router.put('/:id', schoolEventController.updateSchoolEvent);
router.delete('/:id', schoolEventController.deleteSchoolEvent);

module.exports = router;
