const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getSystemStats,
  getRecentActivity,
  getClassStats,
} = require('../controllers/statsController/index');

router.use(protect);
router.use(adminOnly);

router.get('/system', getSystemStats);
router.get('/activity', getRecentActivity);
router.get('/classes', getClassStats);

module.exports = router;
