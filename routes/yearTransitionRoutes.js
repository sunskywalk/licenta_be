const express = require('express');
const router = express.Router();
const yearTransitionController = require('../controllers/yearTransition/index');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/available-grade-years', yearTransitionController.getAvailableGradeYears);
router.get('/student/:studentId/history', yearTransitionController.getStudentClassHistory);
router.get('/preview', adminOnly, yearTransitionController.previewTransition);
router.post('/execute', adminOnly, yearTransitionController.executeTransition);

module.exports = router;
