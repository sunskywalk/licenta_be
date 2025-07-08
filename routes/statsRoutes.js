const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getSystemStats,
  getRecentActivity,
  getClassStats
} = require('../controllers/statsController');

// Все маршруты статистики доступны только админам
router.use(protect);
router.use(adminOnly);

// GET /api/stats/system - Получить общую статистику системы
router.get('/system', getSystemStats);

// GET /api/stats/activity - Получить недавние активности
router.get('/activity', getRecentActivity);

// GET /api/stats/classes - Получить статистику по классам
router.get('/classes', getClassStats);

module.exports = router; 