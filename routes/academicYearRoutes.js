// routes/academicYearRoutes.js
const express = require('express');
const router = express.Router();
const academicYearController = require('../controllers/academicYearController/index');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Все роуты защищены авторизацией
router.use(protect);

// Публичные для авторизованных пользователей
router.get('/active', academicYearController.getActiveAcademicYear);
router.get('/current-period', academicYearController.getCurrentPeriod);
router.get('/presets', academicYearController.getPresets);

// Только для админов
router.get('/', adminOnly, academicYearController.getAllAcademicYears);
router.get('/:id', adminOnly, academicYearController.getAcademicYearById);
router.post('/', adminOnly, academicYearController.createAcademicYear);
router.put('/:id', adminOnly, academicYearController.updateAcademicYear);
router.delete('/:id', adminOnly, academicYearController.deleteAcademicYear);
router.post('/:id/apply-preset', adminOnly, academicYearController.applyPreset);

module.exports = router;
