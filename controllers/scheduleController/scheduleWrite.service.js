const repository = require('./repository');
const { timeToMinutes, sortSchedulePeriods } = require('./helpers');
const { MESSAGES } = require('./constants');

async function computeScheduleConflicts(classId, dayOfWeek, week, semester, year, periods, excludeScheduleId) {
    const conflicts = [];
    const existingSchedules = await repository.findSchedulesForConflictCheck(
        dayOfWeek,
        week,
        semester,
        year,
        excludeScheduleId
    );

    for (const newPeriod of periods) {
        const newStartMinutes = timeToMinutes(newPeriod.startTime);
        const newEndMinutes = timeToMinutes(newPeriod.endTime);
        const newTeacherId = newPeriod.teacherId;

        for (const existingSchedule of existingSchedules) {
            for (const existingPeriod of existingSchedule.periods) {
                const existingStartMinutes = timeToMinutes(existingPeriod.startTime);
                const existingEndMinutes = timeToMinutes(existingPeriod.endTime);
                const existingTeacherId = existingPeriod.teacherId._id;

                const timesOverlap =
                    newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes;

                if (timesOverlap) {
                    if (newTeacherId.toString() === existingTeacherId.toString()) {
                        conflicts.push({
                            type: 'teacher_conflict',
                            message: `Учитель ${existingPeriod.teacherId.name} уже назначен на ${existingPeriod.startTime}-${existingPeriod.endTime} в классе ${existingSchedule.classId.name}`,
                            time: `${existingPeriod.startTime}-${existingPeriod.endTime}`,
                            teacher: existingPeriod.teacherId.name,
                            conflictClass: existingSchedule.classId.name,
                            subject: existingPeriod.subject,
                        });
                    }

                    if (classId.toString() === existingSchedule.classId._id.toString()) {
                        conflicts.push({
                            type: 'class_conflict',
                            message: `Класс ${existingSchedule.classId.name} уже имеет урок ${existingPeriod.subject} в ${existingPeriod.startTime}-${existingPeriod.endTime}`,
                            time: `${existingPeriod.startTime}-${existingPeriod.endTime}`,
                            class: existingSchedule.classId.name,
                            conflictSubject: existingPeriod.subject,
                        });
                    }
                }
            }
        }
    }

    return conflicts;
}

async function createSchedule(body) {
    const { classId, dayOfWeek, week, semester, year, periods } = body;
    const conflicts = await computeScheduleConflicts(classId, dayOfWeek, week, semester, year, periods, null);
    if (conflicts.length > 0) {
        return { ok: false, conflicts, message: MESSAGES.CONFLICT_CREATE };
    }

    const schedule = await repository.insertSchedule({
        classId,
        dayOfWeek,
        week,
        semester,
        year,
        periods,
    });

    const populatedSchedule = await repository.findByIdWithClassAndTeachers(schedule._id);
    sortSchedulePeriods(populatedSchedule);

    return { ok: true, schedule: populatedSchedule };
}

async function updateSchedule(scheduleId, body) {
    const { classId, dayOfWeek, week, semester, year, periods } = body;
    const conflicts = await computeScheduleConflicts(
        classId,
        dayOfWeek,
        week,
        semester,
        year,
        periods,
        scheduleId
    );
    if (conflicts.length > 0) {
        return { ok: false, conflicts, message: MESSAGES.CONFLICT_UPDATE };
    }

    const updated = await repository.updateScheduleById(scheduleId, {
        classId,
        dayOfWeek,
        week,
        semester,
        year,
        periods,
    });

    if (!updated) {
        return { ok: false, notFound: true };
    }

    sortSchedulePeriods(updated);

    return { ok: true, schedule: updated };
}

async function deleteSchedule(scheduleId) {
    const deleted = await repository.deleteScheduleById(scheduleId);
    return { deleted: !!deleted };
}

module.exports = {
    createSchedule,
    updateSchedule,
    deleteSchedule,
};
