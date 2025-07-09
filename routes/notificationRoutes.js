// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, notificationController.createNotification);
router.get('/', protect, notificationController.getAllNotifications);
router.get('/:id', protect, notificationController.getNotificationById);
router.put('/:id', protect, notificationController.updateNotification);
router.delete('/:id', protect, notificationController.deleteNotification);
router.post('/:id/reply', protect, notificationController.replyToNotification);

module.exports = router;