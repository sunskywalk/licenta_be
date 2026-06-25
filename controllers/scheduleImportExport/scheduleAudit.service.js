const Schedule = require('../../models/Schedule');

const DAY_NAMES = {
    0: 'Duminică',
    1: 'Luni',
    2: 'Marți',
    3: 'Miercuri',
    4: 'Joi',
    5: 'Vineri',
    6: 'Sâmbătă',
};

function timeToMinutes(timeStr) {
    const [hours, minutes] = String(timeStr).split(':').map(Number);
    return hours * 60 + minutes;
}

function checkTimeValidity(schedules) {
    const invalidTimes = [];
    const timeFormat = /^([01]?\d|2[0-3]):([0-5]\d)$/;

    for (const schedule of schedules) {
        for (const period of schedule.periods) {
            if (!timeFormat.test(period.startTime)) {
                invalidTimes.push({
                    type: 'INVALID_FORMAT_START',
                    scheduleId: schedule._id,
                    className: schedule.classId?.name || 'Unknown',
                    time: period.startTime,
                    subject: period.subject,
                });
            }
            if (!timeFormat.test(period.endTime)) {
                invalidTimes.push({
                    type: 'INVALID_FORMAT_END',
                    scheduleId: schedule._id,
                    className: schedule.classId?.name || 'Unknown',
                    time: period.endTime,
                    subject: period.subject,
                });
            }
            if (timeToMinutes(period.endTime) <= timeToMinutes(period.startTime)) {
                invalidTimes.push({
                    type: 'INVALID_ORDER',
                    scheduleId: schedule._id,
                    className: schedule.classId?.name || 'Unknown',
                    startTime: period.startTime,
                    endTime: period.endTime,
                    subject: period.subject,
                });
            }
        }
    }

    return invalidTimes;
}

function findScheduleConflicts(schedules) {
    const conflicts = [];
    const grouped = {};

    for (const schedule of schedules) {
        const key = `${schedule.dayOfWeek}-${schedule.week}-${schedule.semester}-${schedule.year}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(schedule);
    }

    for (const groupSchedules of Object.values(grouped)) {
        for (let i = 0; i < groupSchedules.length; i++) {
            const schedule1 = groupSchedules[i];

            for (let j = i + 1; j < groupSchedules.length; j++) {
                const schedule2 = groupSchedules[j];

                for (const period1 of schedule1.periods) {
                    for (const period2 of schedule2.periods) {
                        const timesOverlap =
                            timeToMinutes(period1.startTime) < timeToMinutes(period2.endTime) &&
                            timeToMinutes(period1.endTime) > timeToMinutes(period2.startTime);

                        if (!timesOverlap) {
                            continue;
                        }

                        const teacherId1 = period1.teacherId?._id || period1.teacherId;
                        const teacherId2 = period2.teacherId?._id || period2.teacherId;

                        if (String(teacherId1) === String(teacherId2)) {
                            conflicts.push({
                                type: 'teacher_conflict',
                                dayOfWeek: schedule1.dayOfWeek,
                                dayName: DAY_NAMES[schedule1.dayOfWeek] || String(schedule1.dayOfWeek),
                                week: schedule1.week,
                                semester: schedule1.semester,
                                year: schedule1.year,
                                time: `${period1.startTime}-${period1.endTime}`,
                                teacher: period1.teacherId?.name || 'Unknown',
                                class1: schedule1.classId?.name || 'Unknown',
                                class2: schedule2.classId?.name || 'Unknown',
                                subject1: period1.subject,
                                subject2: period2.subject,
                                message: `Учитель ${period1.teacherId?.name || 'Unknown'} одновременно в ${schedule1.classId?.name} (${period1.subject}) и ${schedule2.classId?.name} (${period2.subject}), ${period1.startTime}-${period1.endTime}`,
                            });
                        }

                        if (String(schedule1.classId?._id || schedule1.classId) ===
                            String(schedule2.classId?._id || schedule2.classId)) {
                            conflicts.push({
                                type: 'class_conflict',
                                dayOfWeek: schedule1.dayOfWeek,
                                dayName: DAY_NAMES[schedule1.dayOfWeek] || String(schedule1.dayOfWeek),
                                week: schedule1.week,
                                semester: schedule1.semester,
                                year: schedule1.year,
                                time: `${period1.startTime}-${period1.endTime}`,
                                class: schedule1.classId?.name || 'Unknown',
                                subject1: period1.subject,
                                subject2: period2.subject,
                                message: `Класс ${schedule1.classId?.name} имеет два урока одновременно: ${period1.subject} и ${period2.subject}, ${period1.startTime}-${period1.endTime}`,
                            });
                        }
                    }
                }
            }
        }
    }

    return conflicts;
}

async function auditScheduleConflicts(filters = {}) {
    const query = {};
    if (filters.year) query.year = parseInt(filters.year, 10);
    if (filters.semester) query.semester = parseInt(filters.semester, 10);
    if (filters.week) query.week = parseInt(filters.week, 10);

    const schedules = await Schedule.find(query)
        .populate('classId', 'name')
        .populate('periods.teacherId', 'name');

    const invalidTimes = checkTimeValidity(schedules);
    const conflicts = findScheduleConflicts(schedules);

    const teacherConflicts = conflicts.filter((c) => c.type === 'teacher_conflict');
    const classConflicts = conflicts.filter((c) => c.type === 'class_conflict');

    return {
        filters: {
            year: filters.year ? parseInt(filters.year, 10) : null,
            semester: filters.semester ? parseInt(filters.semester, 10) : null,
            week: filters.week ? parseInt(filters.week, 10) : null,
        },
        stats: {
            totalSchedules: schedules.length,
            totalPeriods: schedules.reduce((sum, s) => sum + s.periods.length, 0),
            years: [...new Set(schedules.map((s) => s.year))],
            semesters: [...new Set(schedules.map((s) => s.semester))],
        },
        summary: {
            hasIssues: invalidTimes.length > 0 || conflicts.length > 0,
            invalidTimes: invalidTimes.length,
            teacherConflicts: teacherConflicts.length,
            classConflicts: classConflicts.length,
            totalIssues: invalidTimes.length + conflicts.length,
        },
        invalidTimes,
        conflicts,
        message:
            conflicts.length === 0 && invalidTimes.length === 0
                ? 'Конфликтов не найдено'
                : `Найдено проблем: ${invalidTimes.length + conflicts.length}`,
    };
}

module.exports = {
    auditScheduleConflicts,
    findScheduleConflicts,
    checkTimeValidity,
};
