const { getAcademicYearConfig, getCurrentWeekAndSemester } = require('./fallbackConfig');
const { getCurrentWeekAndSemesterAsync } = require('./dbAcademicYear');
const { getWeekStartDate, getWeekDates } = require('./weekDates');

module.exports = {
    getAcademicYearConfig,
    getCurrentWeekAndSemester,
    getCurrentWeekAndSemesterAsync,
    getWeekStartDate,
    getWeekDates,
};
