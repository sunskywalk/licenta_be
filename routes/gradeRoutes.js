// routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController/index');
const { protect } = require('../middleware/authMiddleware');

// ═══════════════════════════════════════════════════════════════
// IMPORTANT: All specific routes MUST come BEFORE the /:id catch-all!
// Express matches routes in order, so /student/:studentId/stats
// would be caught by /:id if /:id is defined first.
// ═══════════════════════════════════════════════════════════════

// ── Teacher-specific routes ──────────────────────────────────
router.get('/my-subjects', protect, gradeController.getTeacherSubjects);
router.get('/my-subjects/:subject/classes', protect, gradeController.getClassroomsForSubject);
router.get('/my-classes', protect, gradeController.getAllTeacherClasses);
router.get('/teacher/:teacherId/subjects', protect, gradeController.getTeacherSubjectsById);
router.get('/teacher/:teacherId', protect, gradeController.getTeacherGrades);

// ── Student-specific routes ──────────────────────────────────
router.get('/student/:studentId/average', protect, gradeController.getStudentAverage);
router.get('/student/:studentId/final', protect, gradeController.getFinalAverage);
router.get('/student/:studentId/stats', protect, gradeController.getStudentGradeStats);
router.get('/student/:studentId/subject/:subject', protect, gradeController.getStudentSubjectStats);
router.get('/student/:studentId', protect, gradeController.getStudentGrades);

// ── Class-specific routes ────────────────────────────────────
router.get('/class/:classId', protect, gradeController.getGradesByClass);

// ── CRUD (/:id must be LAST among GET routes) ────────────────
router.post('/', protect, gradeController.createGrade);
router.get('/', protect, gradeController.getAllGrades);
router.get('/:id', protect, gradeController.getGradeById);
router.put('/:id', protect, gradeController.updateGrade);
router.delete('/:id', protect, gradeController.deleteGrade);

module.exports = router;