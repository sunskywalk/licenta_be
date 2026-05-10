const { EXPORT_VERSION, MESSAGES } = require('./constants');

function buildExportFilename(classIdParam, firstScheduleClassName, dateStr) {
    const label =
        classIdParam === 'all' ? 'all' : firstScheduleClassName || classIdParam;
    return `schedule_export_${label}_${dateStr}.json`;
}

function mapPeriodForExport(period) {
    const t = period.teacherId;
    const isObj = typeof t === 'object' && t !== null;
    return {
        subject: period.subject,
        teacherName: isObj ? t.name : 'Unknown',
        teacherId: isObj ? t._id : period.teacherId,
        teacherEmail: isObj ? t.email : null,
        startTime: period.startTime,
        endTime: period.endTime,
        room: period.room || '',
    };
}

function mapScheduleForExport(schedule) {
    return {
        className: schedule.classId?.name || 'Unknown',
        classId: schedule.classId?._id || schedule.classId,
        dayOfWeek: schedule.dayOfWeek,
        week: schedule.week,
        semester: schedule.semester,
        year: schedule.year,
        periods: schedule.periods.map(mapPeriodForExport),
    };
}

function buildFilters(classId, semester, week) {
    return {
        classId: classId !== 'all' ? classId : null,
        semester: semester ? parseInt(semester, 10) : null,
        week: week ? parseInt(week, 10) : null,
    };
}

function buildEmptyExportPayload(userId, classId, semester, week) {
    return {
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        version: EXPORT_VERSION,
        filters: buildFilters(classId, semester, week),
        totalSchedules: 0,
        schedules: [],
        message: MESSAGES.EMPTY_EXPORT_HINT,
    };
}

function buildExportPayload(userId, schedules, classId, semester, week) {
    return {
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        version: EXPORT_VERSION,
        filters: buildFilters(classId, semester, week),
        totalSchedules: schedules.length,
        schedules: schedules.map(mapScheduleForExport),
    };
}

module.exports = {
    buildExportFilename,
    buildEmptyExportPayload,
    buildExportPayload,
};
