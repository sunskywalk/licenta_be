const repo = require('./repository');
const { MESSAGES } = require('./constants');
const { isValidSchedulesPayload } = require('./validators');

async function resolveTeacherForPeriod(period, entryIndex, results, emailCache, nameCache) {
    let teacherId = period.teacherId;

    if (period.teacherEmail && !teacherId) {
        let teacher = emailCache.get(period.teacherEmail);
        if (!teacher) {
            teacher = await repo.findTeacherByEmail(period.teacherEmail);
            if (teacher) {
                emailCache.set(period.teacherEmail, teacher);
            }
        }
        if (teacher) {
            teacherId = teacher._id;
        }
    }

    if (period.teacherName && !teacherId) {
        let teacher = nameCache.get(period.teacherName);
        if (!teacher) {
            teacher = await repo.findTeacherByName(period.teacherName);
            if (teacher) {
                nameCache.set(period.teacherName, teacher);
            }
        }
        if (teacher) {
            teacherId = teacher._id;
            results.warnings.push({
                index: entryIndex,
                message: `Запись #${entryIndex + 1}: Учитель "${period.teacherName}" найден по имени`,
            });
        }
    }

    return teacherId;
}

async function importSchedule(req) {
    const { schedules, options = {} } = req.body;
    const { overwrite = false, dryRun = false } = options;

    if (!isValidSchedulesPayload(schedules)) {
        return {
            status: 400,
            body: { message: MESSAGES.IMPORT_BODY_REQUIRED },
        };
    }

    const results = {
        total: schedules.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        warnings: [],
    };

    const emailCache = new Map();
    const nameCache = new Map();

    for (let i = 0; i < schedules.length; i++) {
        const entry = schedules[i];

        try {
            if (
                !entry.classId ||
                entry.dayOfWeek === undefined ||
                !entry.week ||
                !entry.semester ||
                !entry.periods
            ) {
                results.errors.push({
                    index: i,
                    message: `Запись #${i + 1}: Отсутствуют обязательные поля (classId, dayOfWeek, week, semester, periods)`,
                });
                results.skipped++;
                continue;
            }

            const classExists = await repo.findClassroomById(entry.classId);
            if (!classExists) {
                const classByName = await repo.findClassroomByName(entry.className);
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

            const resolvedPeriods = [];
            for (const period of entry.periods) {
                if (!period.subject || !period.startTime || !period.endTime) {
                    results.errors.push({
                        index: i,
                        message: `Запись #${i + 1}: Период с отсутствующими полями (subject, startTime, endTime)`,
                    });
                    continue;
                }

                const teacherId = await resolveTeacherForPeriod(
                    period,
                    i,
                    results,
                    emailCache,
                    nameCache
                );

                if (!teacherId) {
                    results.errors.push({
                        index: i,
                        message: `Запись #${i + 1}: Учитель "${period.teacherName || 'Unknown'}" не найден`,
                    });
                    continue;
                }

                resolvedPeriods.push({
                    subject: period.subject,
                    teacherId,
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

            if (dryRun) {
                results.created++;
                continue;
            }

            const existing = await repo.findScheduleSlot(
                entry.classId,
                entry.dayOfWeek,
                entry.week,
                entry.semester
            );

            if (existing) {
                if (overwrite) {
                    await repo.saveExistingSchedule(
                        existing,
                        resolvedPeriods,
                        entry.year || new Date().getFullYear()
                    );
                    results.updated++;
                } else {
                    results.warnings.push({
                        index: i,
                        message: `Запись #${i + 1}: Расписание уже существует (пропущено, используйте overwrite: true)`,
                    });
                    results.skipped++;
                }
            } else {
                await repo.createScheduleDoc({
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
    const body = {
        message: dryRun
            ? `Dry run завершён: ${results.created} записей валидны`
            : `Импорт завершён: ${results.created} создано, ${results.updated} обновлено, ${results.skipped} пропущено`,
        dryRun,
        results,
    };

    return { status, body };
}

module.exports = {
    importSchedule,
};
