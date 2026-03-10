// controllers/scheduleImportExport.js
// Controller for schedule import/export functionality

const Schedule = require('../models/Schedule');
const Classroom = require('../models/Classroom');
const User = require('../models/User');

/**
 * @desc    Export schedule for a class (or all) as JSON
 * @route   GET /api/schedule/export/:classId
 * @query   ?semester=1&format=json
 * @access  Admin only
 */
exports.exportSchedule = async (req, res) => {
    try {
        const { classId } = req.params;
        const { semester, week } = req.query;

        // Build query — start with class filter
        const query = {};
        if (classId && classId !== 'all') {
            query.classId = classId;
        }
        if (semester) {
            query.semester = parseInt(semester);
        }

        // First try with week filter
        let schedules = await Schedule.find({ ...query, ...(week ? { week: parseInt(week) } : {}) })
            .populate('classId', 'name')
            .populate('periods.teacherId', 'name email')
            .sort({ classId: 1, semester: 1, week: 1, dayOfWeek: 1 });

        // If nothing found with week filter, try without week (export all weeks for this semester)
        if (schedules.length === 0 && week) {
            console.log('[exportSchedule] No schedules for specific week, trying without week filter');
            schedules = await Schedule.find(query)
                .populate('classId', 'name')
                .populate('periods.teacherId', 'name email')
                .sort({ classId: 1, semester: 1, week: 1, dayOfWeek: 1 });
        }

        if (schedules.length === 0) {
            // Return empty export instead of 404 — cleaner UX
            return res.json({
                exportedAt: new Date().toISOString(),
                exportedBy: req.user.userId,
                version: '1.0',
                filters: {
                    classId: classId !== 'all' ? classId : null,
                    semester: semester ? parseInt(semester) : null,
                    week: week ? parseInt(week) : null,
                },
                totalSchedules: 0,
                schedules: [],
                message: 'No schedules found for the given parameters',
            });
        }

        // Format for export
        const exportData = {
            exportedAt: new Date().toISOString(),
            exportedBy: req.user.userId,
            version: '1.0',
            filters: {
                classId: classId !== 'all' ? classId : null,
                semester: semester ? parseInt(semester) : null,
                week: week ? parseInt(week) : null,
            },
            totalSchedules: schedules.length,
            schedules: schedules.map(schedule => ({
                className: schedule.classId?.name || 'Unknown',
                classId: schedule.classId?._id || schedule.classId,
                dayOfWeek: schedule.dayOfWeek,
                week: schedule.week,
                semester: schedule.semester,
                year: schedule.year,
                periods: schedule.periods.map(period => ({
                    subject: period.subject,
                    teacherName: typeof period.teacherId === 'object' ? period.teacherId.name : 'Unknown',
                    teacherId: typeof period.teacherId === 'object' ? period.teacherId._id : period.teacherId,
                    teacherEmail: typeof period.teacherId === 'object' ? period.teacherId.email : null,
                    startTime: period.startTime,
                    endTime: period.endTime,
                    room: period.room || '',
                })),
            })),
        };

        // Set headers for file download
        const filename = `schedule_export_${classId === 'all' ? 'all' : schedules[0]?.classId?.name || classId}_${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');

        res.json(exportData);
    } catch (error) {
        console.error('[exportSchedule] Error:', error);
        res.status(500).json({ message: 'Ошибка при экспорте расписания', error: error.message });
    }
};

/**
 * @desc    Import schedule from JSON
 * @route   POST /api/schedule/import
 * @body    { schedules: [...], options: { overwrite: boolean, dryRun: boolean } }
 * @access  Admin only
 */
exports.importSchedule = async (req, res) => {
    try {
        const { schedules, options = {} } = req.body;
        const { overwrite = false, dryRun = false } = options;

        if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
            return res.status(400).json({ message: 'Массив расписаний обязателен и не может быть пустым' });
        }

        const results = {
            total: schedules.length,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: [],
            warnings: [],
        };

        for (let i = 0; i < schedules.length; i++) {
            const entry = schedules[i];

            try {
                // Validate required fields
                if (!entry.classId || entry.dayOfWeek === undefined || !entry.week || !entry.semester || !entry.periods) {
                    results.errors.push({
                        index: i,
                        message: `Запись #${i + 1}: Отсутствуют обязательные поля (classId, dayOfWeek, week, semester, periods)`,
                    });
                    results.skipped++;
                    continue;
                }

                // Verify class exists
                const classroom = await Classroom.findById(entry.classId);
                if (!classroom) {
                    // Try to find by name
                    const classByName = await Classroom.findOne({ name: entry.className });
                    if (classByName) {
                        entry.classId = classByName._id;
                        results.warnings.push({
                            index: i,
                            message: `Запись #${i + 1}: Класс найден по имени "${entry.className}"`,
                        });
                    } else {
                        results.errors.push({
                            index: i,
                            message: `Запись #${i + 1}: Класс "${entry.className || entry.classId}" не найден`,
                        });
                        results.skipped++;
                        continue;
                    }
                }

                // Validate and resolve teacher IDs in periods
                const resolvedPeriods = [];
                for (const period of entry.periods) {
                    if (!period.subject || !period.startTime || !period.endTime) {
                        results.errors.push({
                            index: i,
                            message: `Запись #${i + 1}: Период с отсутствующими полями (subject, startTime, endTime)`,
                        });
                        continue;
                    }

                    let teacherId = period.teacherId;

                    // Try to resolve teacher by email if ID not valid
                    if (period.teacherEmail && !teacherId) {
                        const teacher = await User.findOne({ email: period.teacherEmail, role: 'teacher' });
                        if (teacher) {
                            teacherId = teacher._id;
                        }
                    }

                    // Try to resolve by name
                    if (period.teacherName && !teacherId) {
                        const teacher = await User.findOne({ name: period.teacherName, role: 'teacher' });
                        if (teacher) {
                            teacherId = teacher._id;
                            results.warnings.push({
                                index: i,
                                message: `Запись #${i + 1}: Учитель "${period.teacherName}" найден по имени`,
                            });
                        }
                    }

                    if (!teacherId) {
                        results.errors.push({
                            index: i,
                            message: `Запись #${i + 1}: Учитель "${period.teacherName || 'Unknown'}" не найден`,
                        });
                        continue;
                    }

                    resolvedPeriods.push({
                        subject: period.subject,
                        teacherId: teacherId,
                        startTime: period.startTime,
                        endTime: period.endTime,
                        room: period.room || '',
                    });
                }

                if (resolvedPeriods.length === 0) {
                    results.errors.push({
                        index: i,
                        message: `Запись #${i + 1}: Нет валидных периодов после проверки`,
                    });
                    results.skipped++;
                    continue;
                }

                // If dry run, just validate without saving
                if (dryRun) {
                    results.created++;
                    continue;
                }

                // Check for existing schedule
                const existing = await Schedule.findOne({
                    classId: entry.classId,
                    dayOfWeek: entry.dayOfWeek,
                    week: entry.week,
                    semester: entry.semester,
                });

                if (existing) {
                    if (overwrite) {
                        existing.periods = resolvedPeriods;
                        existing.year = entry.year || new Date().getFullYear();
                        await existing.save();
                        results.updated++;
                    } else {
                        results.warnings.push({
                            index: i,
                            message: `Запись #${i + 1}: Расписание уже существует (пропущено, используйте overwrite: true)`,
                        });
                        results.skipped++;
                    }
                } else {
                    await Schedule.create({
                        classId: entry.classId,
                        dayOfWeek: entry.dayOfWeek,
                        week: entry.week,
                        semester: entry.semester,
                        year: entry.year || new Date().getFullYear(),
                        periods: resolvedPeriods,
                    });
                    results.created++;
                }
            } catch (entryError) {
                results.errors.push({
                    index: i,
                    message: `Запись #${i + 1}: ${entryError.message}`,
                });
                results.skipped++;
            }
        }

        const status = results.errors.length > 0 ? 207 : 200;
        res.status(status).json({
            message: dryRun
                ? `Dry run завершён: ${results.created} записей валидны`
                : `Импорт завершён: ${results.created} создано, ${results.updated} обновлено, ${results.skipped} пропущено`,
            dryRun,
            results,
        });
    } catch (error) {
        console.error('[importSchedule] Error:', error);
        res.status(500).json({ message: 'Ошибка при импорте расписания', error: error.message });
    }
};

/**
 * @desc    Download empty template for schedule import
 * @route   GET /api/schedule/export-template
 * @access  Admin only
 */
exports.getImportTemplate = async (req, res) => {
    try {
        // Get available classes and teachers for reference
        const classes = await Classroom.find().select('name _id').sort({ name: 1 });
        const teachers = await User.find({ role: 'teacher' }).select('name email _id').sort({ name: 1 });

        const template = {
            _templateVersion: '1.0',
            _instructions: {
                ru: 'Заполните массив schedules и отправьте POST на /api/schedule/import. Используйте classId из списка availableClasses и teacherId из availableTeachers.',
                en: 'Fill in the schedules array and POST to /api/schedule/import. Use classId from availableClasses and teacherId from availableTeachers.',
            },
            availableClasses: classes.map(c => ({ id: c._id, name: c.name })),
            availableTeachers: teachers.map(t => ({ id: t._id, name: t.name, email: t.email })),
            options: {
                overwrite: false,
                dryRun: true,
            },
            schedules: [
                {
                    classId: classes[0]?._id || 'CLASS_ID_HERE',
                    className: classes[0]?.name || 'Example Class',
                    dayOfWeek: 1,
                    week: 1,
                    semester: 1,
                    year: new Date().getFullYear(),
                    periods: [
                        {
                            subject: 'Matematică',
                            teacherId: teachers[0]?._id || 'TEACHER_ID_HERE',
                            teacherName: teachers[0]?.name || 'Teacher Name',
                            teacherEmail: teachers[0]?.email || 'teacher@example.com',
                            startTime: '08:00',
                            endTime: '08:45',
                            room: '101',
                        },
                    ],
                },
            ],
        };

        const filename = `schedule_import_template_${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');

        res.json(template);
    } catch (error) {
        console.error('[getImportTemplate] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
};
