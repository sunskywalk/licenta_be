// routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController/index');
const scheduleImportExport = require('../controllers/scheduleImportExport/index');
const { protect, checkRole } = require('../middleware/authMiddleware');

// создать расписание (admin)
router.post('/', protect, checkRole(['admin']), scheduleController.createSchedule);

// получить все
router.get('/', protect, scheduleController.getAllSchedules);

// получить текущий учебный год, семестр и неделю
router.get('/current-week', protect, scheduleController.getCurrentAcademicInfo);

// получить даты для конкретной недели семестра
router.get('/week-dates/:semester/:week', protect, scheduleController.getWeekDates);

// получить расписание для конкретного учителя
router.get('/teacher/:teacherId', protect, checkRole(['teacher', 'admin']), scheduleController.getTeacherSchedule);

// получить расписание для конкретного класса
router.get('/class/:classId', protect, scheduleController.getScheduleByClass);

// получить детали урока для студента
router.get('/student/:studentId/lesson/:subject/:date', protect, scheduleController.getStudentLessonDetails);

// получить расписание для конкретного дня недели
router.get('/day/:dayOfWeek', protect, scheduleController.getScheduleByDay);

// получить расписание с событиями для конкретной даты
router.get('/with-events/:userId/:date', protect, scheduleController.getScheduleWithEvents);

// ─────────────────────────────────────────────────────────
// Schedule Import/Export (admin only)
// ВАЖНО: эти маршруты ДОЛЖНЫ быть ДО /:id чтобы не перехватывались
// ─────────────────────────────────────────────────────────

// Скачать шаблон для импорта (admin only)
router.get('/export-template', protect, checkRole(['admin']), scheduleImportExport.getImportTemplate);

// Экспорт расписания в JSON (доступно admin и teacher)
router.get('/export/:classId', protect, checkRole(['admin', 'teacher']), scheduleImportExport.exportSchedule);

// Импорт расписания из JSON
router.post('/import', protect, checkRole(['admin']), scheduleImportExport.importSchedule);

// ─────────────────────────────────────────────────────────
// CRUD by ID (MUST be LAST — /:id is a catch-all)
// ─────────────────────────────────────────────────────────

// получить одно
router.get('/:id', protect, scheduleController.getScheduleById);

// обновить (admin)
router.put('/:id', protect, checkRole(['admin']), scheduleController.updateSchedule);

// удалить (admin)
router.delete('/:id', protect, checkRole(['admin']), scheduleController.deleteSchedule);

module.exports = router;