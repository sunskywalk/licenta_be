const repo = require('./repository');
const { MESSAGES } = require('./constants');
const { isValidSchedulesPayload } = require('./validators');
const { parseExcelBuffer, detectBatchConflicts } = require('./excelHelpers');
const { computeScheduleConflicts } = require('../scheduleController/scheduleWrite.service');

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

async function resolveClassId(entry, entryIndex, results) {
    if (entry.classId) {
        const classExists = await repo.findClassroomById(entry.classId);
        if (classExists) {
            return classExists._id;
        }
    }

    if (entry.className) {
        const classByName = await repo.findClassroomByName(entry.className);
        if (classByName) {
            results.warnings.push({
                index: entryIndex,
                message: `Запись #${entryIndex + 1}: Класс найден по имени "${entry.className}"`,
            });
            return classByName._id;
        }
    }

    results.errors.push({
        index: entryIndex,
        message: `Запись #${entryIndex + 1}: Класс "${entry.className || entry.classId}" не найден`,
    });
    return null;
}

async function resolveEntryPeriods(entry, entryIndex, results, emailCache, nameCache) {
    const resolvedPeriods = [];

    for (const period of entry.periods || []) {
        if (!period.subject || !period.startTime || !period.endTime) {
            results.errors.push({
                index: entryIndex,
                message: `Запись #${entryIndex + 1}: Период с отсутствующими полями (subject, startTime, endTime)`,
            });
            continue;
        }

        const teacherId = await resolveTeacherForPeriod(
            period,
            entryIndex,
            results,
            emailCache,
            nameCache
        );

        if (!teacherId) {
            results.errors.push({
                index: entryIndex,
                message: `Запись #${entryIndex + 1}: Учитель "${period.teacherName || period.teacherEmail || 'Unknown'}" не найден`,
            });
            continue;
        }

        resolvedPeriods.push({
            subject: period.subject,
            teacherId,
            teacherName: period.teacherName,
            teacherEmail: period.teacherEmail,
            startTime: period.startTime,
            endTime: period.endTime,
            room: period.room || '',
        });
    }

    return resolvedPeriods;
}

async function processImportEntries(schedules, options = {}) {
    const { overwrite = false, dryRun = false, skipConflictCheck = false } = options;

    const results = {
        total: schedules.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        warnings: [],
        conflicts: [],
    };

    const emailCache = new Map();
    const nameCache = new Map();
    const resolvedEntries = [];

    for (let i = 0; i < schedules.length; i++) {
        const entry = schedules[i];

        if (
            entry.dayOfWeek === undefined ||
            !entry.week ||
            !entry.semester ||
            !entry.periods
        ) {
            results.errors.push({
                index: i,
                message: `Запись #${i + 1}: Отсутствуют обязательные поля (classId/className, dayOfWeek, week, semester, periods)`,
            });
            results.skipped++;
            continue;
        }

        const classId = await resolveClassId(entry, i, results);
        if (!classId) {
            results.skipped++;
            continue;
        }

        const resolvedPeriods = await resolveEntryPeriods(
            entry,
            i,
            results,
            emailCache,
            nameCache
        );

        if (resolvedPeriods.length === 0) {
            results.errors.push({
                index: i,
                message: `Запись #${i + 1}: Нет валидных периодов после проверки`,
            });
            results.skipped++;
            continue;
        }

        resolvedEntries.push({
            index: i,
            classId,
            className: entry.className,
            dayOfWeek: entry.dayOfWeek,
            week: entry.week,
            semester: entry.semester,
            year: entry.year || new Date().getFullYear(),
            periods: resolvedPeriods,
        });
    }

    if (!skipConflictCheck && resolvedEntries.length > 0) {
        const batchConflicts = detectBatchConflicts(resolvedEntries);
        if (batchConflicts.length > 0) {
            results.conflicts.push(...batchConflicts);
        }

        for (const entry of resolvedEntries) {
            const existing = await repo.findScheduleSlot(
                entry.classId,
                entry.dayOfWeek,
                entry.week,
                entry.semester
            );

            const dbConflicts = await computeScheduleConflicts(
                entry.classId,
                entry.dayOfWeek,
                entry.week,
                entry.semester,
                entry.year,
                entry.periods,
                existing?._id || null
            );

            if (dbConflicts.length > 0) {
                results.conflicts.push(
                    ...dbConflicts.map((conflict) => ({
                        ...conflict,
                        index: entry.index,
                        className: entry.className,
                    }))
                );
            }
        }
    }

    if (results.conflicts.length > 0) {
        return {
            status: 409,
            body: {
                message: 'Импорт отменён: обнаружены конфликты расписания',
                dryRun,
                results,
            },
        };
    }

    for (const entry of resolvedEntries) {
        const persistPeriods = entry.periods.map(({ teacherName, teacherEmail, ...period }) => period);

        if (dryRun) {
            results.created++;
            continue;
        }

        try {
            const existing = await repo.findScheduleSlot(
                entry.classId,
                entry.dayOfWeek,
                entry.week,
                entry.semester
            );

            if (existing) {
                if (overwrite) {
                    await repo.saveExistingSchedule(existing, persistPeriods, entry.year);
                    results.updated++;
                } else {
                    results.warnings.push({
                        index: entry.index,
                        message: `Запись #${entry.index + 1}: Расписание уже существует (пропущено, используйте overwrite: true)`,
                    });
                    results.skipped++;
                }
            } else {
                await repo.createScheduleDoc({
                    classId: entry.classId,
                    dayOfWeek: entry.dayOfWeek,
                    week: entry.week,
                    semester: entry.semester,
                    year: entry.year,
                    periods: persistPeriods,
                });
                results.created++;
            }
        } catch (entryError) {
            results.errors.push({
                index: entry.index,
                message: `Запись #${entry.index + 1}: ${entryError.message}`,
            });
            results.skipped++;
        }
    }

    const status = results.errors.length > 0 ? 207 : 200;
    return {
        status,
        body: {
            message: dryRun
                ? `Dry run завершён: ${results.created} записей валидны`
                : `Импорт завершён: ${results.created} создано, ${results.updated} обновлено, ${results.skipped} пропущено`,
            dryRun,
            results,
        },
    };
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

    return processImportEntries(schedules, { overwrite, dryRun });
}

async function importScheduleExcel(req) {
    if (!req.file || !req.file.buffer) {
        return {
            status: 400,
            body: { message: 'Файл Excel обязателен (поле file)' },
        };
    }

    const overwrite = req.body?.overwrite === 'true' || req.body?.overwrite === true;
    const dryRun = req.body?.dryRun === 'true' || req.body?.dryRun === true;

    let parsed;
    try {
        parsed = parseExcelBuffer(req.file.buffer);
    } catch (error) {
        return {
            status: 400,
            body: { message: `Ошибка чтения Excel: ${error.message}` },
        };
    }

    if (parsed.errors.length > 0 && parsed.schedules.length === 0) {
        return {
            status: 400,
            body: {
                message: 'Excel не содержит валидных строк расписания',
                results: { errors: parsed.errors },
            },
        };
    }

    const result = await processImportEntries(parsed.schedules, { overwrite, dryRun });

    if (parsed.errors.length > 0) {
        result.body.results.errors = [...parsed.errors, ...result.body.results.errors];
        if (result.status === 200) {
            result.status = 207;
        }
    }

    return result;
}

module.exports = {
    importSchedule,
    importScheduleExcel,
    processImportEntries,
};
