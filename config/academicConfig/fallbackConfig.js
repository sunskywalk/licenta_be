const { MS_PER_WEEK } = require('./constants');
const { buildPeriodsSummary, buildVacationResult } = require('./helpers');

function getAcademicYearConfig() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1;

    const sem1Start = new Date(academicYear, 8, 2);
    const sem1End = new Date(academicYear + 1, 0, 17);
    const sem2Start = new Date(academicYear + 1, 0, 27);
    const sem2End = new Date(academicYear + 1, 5, 20);

    const calcWeeks = (start, end) => {
        const diffMs = Math.abs(end - start);
        return Math.ceil(diffMs / MS_PER_WEEK);
    };

    return {
        academicYear,
        semester1: { start: sem1Start, end: sem1End, weeks: calcWeeks(sem1Start, sem1End) },
        semester2: { start: sem2Start, end: sem2End, weeks: calcWeeks(sem2Start, sem2End) },
    };
}

function getCurrentWeekAndSemester() {
    const now = new Date();
    const config = getAcademicYearConfig();

    let currentSemester = null;
    let semesterStart = null;
    let maxWeeks = 16;

    if (now >= config.semester1.start && now <= config.semester1.end) {
        currentSemester = 1;
        semesterStart = config.semester1.start;
        maxWeeks = config.semester1.weeks;
    } else if (now >= config.semester2.start && now <= config.semester2.end) {
        currentSemester = 2;
        semesterStart = config.semester2.start;
        maxWeeks = config.semester2.weeks;
    } else if (now < config.semester1.start) {
        return buildVacationResult(
            config.academicYear,
            1,
            config.semester1.weeks,
            buildPeriodsSummary(config.semester1.weeks, config.semester2.weeks)
        );
    } else if (now > config.semester1.end && now < config.semester2.start) {
        return buildVacationResult(
            config.academicYear,
            2,
            config.semester2.weeks,
            buildPeriodsSummary(config.semester1.weeks, config.semester2.weeks)
        );
    } else {
        return buildVacationResult(
            config.academicYear + 1,
            1,
            config.semester1.weeks,
            buildPeriodsSummary(config.semester1.weeks, config.semester2.weeks)
        );
    }

    const diffMs = now.getTime() - semesterStart.getTime();
    let currentWeek = Math.floor(diffMs / MS_PER_WEEK) + 1;
    currentWeek = Math.min(currentWeek, maxWeeks);
    currentWeek = Math.max(currentWeek, 1);

    return {
        academicYear: config.academicYear,
        currentSemester,
        currentWeek,
        weekCount: maxWeeks,
        isVacation: false,
        periods: buildPeriodsSummary(config.semester1.weeks, config.semester2.weeks),
    };
}

module.exports = {
    getAcademicYearConfig,
    getCurrentWeekAndSemester,
};
