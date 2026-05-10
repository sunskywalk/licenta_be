const express = require('express');
const router = express.Router();
const academicYearController = require('../controllers/academicYearController/index');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/active', academicYearController.getActiveAcademicYear);
router.get('/current-period', academicYearController.getCurrentPeriod);
router.get('/presets', academicYearController.getPresets);

router.get('/', adminOnly, academicYearController.getAllAcademicYears);
router.get('/:id', adminOnly, academicYearController.getAcademicYearById);
router.post('/', adminOnly, academicYearController.createAcademicYear);
router.put('/:id', adminOnly, academicYearController.updateAcademicYear);
router.delete('/:id', adminOnly, academicYearController.deleteAcademicYear);
router.post('/:id/apply-preset', adminOnly, academicYearController.applyPreset);

module.exports = router;
