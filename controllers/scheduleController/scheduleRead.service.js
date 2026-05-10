const repository = require('./repository');
const { sortSchedulePeriods } = require('./helpers');

async function getAllSchedules() {
    const schedules = await repository.findAllSchedulesDeepPopulate();
    schedules.forEach((schedule) => sortSchedulePeriods(schedule));
    return schedules;
}

async function getScheduleById(id) {
    const schedule = await repository.findByIdWithClassAndTeachers(id);
    if (!schedule) return null;
    sortSchedulePeriods(schedule);
    return schedule;
}

async function getTeacherSchedule(teacherId) {
    const schedules = await repository.findSchedulesByTeacherId(teacherId);
    schedules.forEach((schedule) => sortSchedulePeriods(schedule));
    return schedules;
}

async function getScheduleByClass(classId) {
    const schedules = await repository.findSchedulesByClassId(classId);
    schedules.forEach((schedule) => sortSchedulePeriods(schedule));
    return schedules;
}

async function getScheduleByDay(dayOfWeek) {
    const schedules = await repository.findSchedulesByDayOfWeek(parseInt(dayOfWeek, 10));
    schedules.forEach((schedule) => sortSchedulePeriods(schedule));
    return schedules;
}

module.exports = {
    getAllSchedules,
    getScheduleById,
    getTeacherSchedule,
    getScheduleByClass,
    getScheduleByDay,
};
