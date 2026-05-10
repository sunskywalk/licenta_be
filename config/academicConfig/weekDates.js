const { loadActiveAcademicYear } = require('./dbAcademicYear');
const { getAcademicYearConfig } = require('./fallbackConfig');

async function getWeekStartDate(semester, week) {
    const dbYear = await loadActiveAcademicYear();
    let startDate;

    if (dbYear && dbYear.periods && dbYear.periods.length > 0) {
        const period = dbYear.periods.find((item) => item.periodNumber === semester);
        if (period) {
            startDate = new Date(period.startDate);
        } else {
            startDate = new Date(dbYear.periods[0].startDate);
        }
    } else {
        const config = getAcademicYearConfig();
        const semesterConfig = semester === 1 ? config.semester1 : config.semester2;
        startDate = new Date(semesterConfig ? semesterConfig.start : config.semester1.start);
    }

    const dayOfWeek = startDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
    startDate.setDate(startDate.getDate() + daysToMonday);
    startDate.setDate(startDate.getDate() + (week - 1) * 7);

    return startDate;
}

async function getWeekDates(semester, week) {
    const monday = await getWeekStartDate(semester, week);
    const dates = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (let index = 0; index < 7; index++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        dates[days[index]] = date.toISOString().split('T')[0];
    }

    return dates;
}

module.exports = {
    getWeekStartDate,
    getWeekDates,
};
