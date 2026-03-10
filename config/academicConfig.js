// config/academicConfig.js
// Конфигурация учебного года для системы расписания
const AcademicYear = require('../models/AcademicYear');

// Cache for active academic year to avoid repeated DB calls
let cachedAcademicYear = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load active academic year from DB (with caching)
 */
async function loadActiveAcademicYear() {
    const now = Date.now();
    if (cachedAcademicYear && (now - cacheTimestamp) < CACHE_TTL) {
        return cachedAcademicYear;
    }
    try {
        const activeYear = await AcademicYear.getActive();
        if (activeYear && activeYear.periods && activeYear.periods.length > 0) {
            cachedAcademicYear = activeYear;
            cacheTimestamp = now;
            return activeYear;
        }
    } catch (error) {
        console.error('Error loading AcademicYear from DB:', error.message);
    }
    return null;
}

/**
 * Получить конфигурацию текущего учебного года (fallback)
 */
function getAcademicYearConfig() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1;

    // Calculate actual weeks from dates
    const sem1Start = new Date(academicYear, 8, 2);
    const sem1End = new Date(academicYear + 1, 0, 17);
    const sem2Start = new Date(academicYear + 1, 0, 27);
    const sem2End = new Date(academicYear + 1, 5, 20);

    const calcWeeks = (start, end) => {
        const diffMs = Math.abs(end - start);
        return Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
    };

    return {
        academicYear,
        semester1: { start: sem1Start, end: sem1End, weeks: calcWeeks(sem1Start, sem1End) },
        semester2: { start: sem2Start, end: sem2End, weeks: calcWeeks(sem2Start, sem2End) },
    };
}

/**
 * Определить текущий семестр и неделю (async — пытается использовать DB)
 */
async function getCurrentWeekAndSemesterAsync() {
    const dbYear = await loadActiveAcademicYear();
    if (dbYear) {
        return getInfoFromDbYear(dbYear);
    }
    // Fallback to hardcoded config
    return getCurrentWeekAndSemester();
}

/**
 * Get info from DB-based AcademicYear
 */
function getInfoFromDbYear(dbYear) {
    const now = new Date();
    now.setHours(12, 0, 0, 0);

    const periods = dbYear.periods.sort((a, b) => a.periodNumber - b.periodNumber);

    // Find current period
    let currentPeriod = null;
    for (const period of periods) {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        if (now >= start && now <= end) {
            currentPeriod = period;
            break;
        }
    }

    if (!currentPeriod) {
        // Outside any period — find nearest
        let nearest = periods[0];
        let minDiff = Infinity;
        for (const period of periods) {
            const diff = Math.abs(now - new Date(period.startDate));
            if (diff < minDiff) {
                minDiff = diff;
                nearest = period;
            }
        }
        currentPeriod = nearest;
    }

    // Calculate current week within this period
    const periodStart = new Date(currentPeriod.startDate);
    periodStart.setHours(0, 0, 0, 0);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffMs = now.getTime() - periodStart.getTime();
    let currentWeek = Math.floor(diffMs / msPerWeek) + 1;
    const weekCount = currentPeriod.weekCount || 16;
    currentWeek = Math.max(1, Math.min(currentWeek, weekCount));

    // Build period info for all periods
    const periodsInfo = periods.map(p => ({
        periodNumber: p.periodNumber,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
        weekCount: p.weekCount || 16,
    }));

    return {
        academicYear: dbYear.year,
        currentSemester: currentPeriod.periodNumber,
        currentWeek,
        weekCount,
        isVacation: false,
        systemType: dbYear.systemType,
        periods: periodsInfo,
    };
}

/**
 * Sync fallback: Определить текущий семестр и неделю
 */
function getCurrentWeekAndSemester() {
    const now = new Date();
    const config = getAcademicYearConfig();

    let currentSemester = null;
    let currentWeek = null;
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
    } else {
        if (now < config.semester1.start) {
            return {
                academicYear: config.academicYear, currentSemester: 1, currentWeek: 1,
                weekCount: config.semester1.weeks, isVacation: true,
                periods: [
                    { periodNumber: 1, weekCount: config.semester1.weeks },
                    { periodNumber: 2, weekCount: config.semester2.weeks },
                ]
            };
        } else if (now > config.semester1.end && now < config.semester2.start) {
            return {
                academicYear: config.academicYear, currentSemester: 2, currentWeek: 1,
                weekCount: config.semester2.weeks, isVacation: true,
                periods: [
                    { periodNumber: 1, weekCount: config.semester1.weeks },
                    { periodNumber: 2, weekCount: config.semester2.weeks },
                ]
            };
        } else {
            return {
                academicYear: config.academicYear + 1, currentSemester: 1, currentWeek: 1,
                weekCount: config.semester1.weeks, isVacation: true,
                periods: [
                    { periodNumber: 1, weekCount: config.semester1.weeks },
                    { periodNumber: 2, weekCount: config.semester2.weeks },
                ]
            };
        }
    }

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffMs = now.getTime() - semesterStart.getTime();
    currentWeek = Math.floor(diffMs / msPerWeek) + 1;
    currentWeek = Math.min(currentWeek, maxWeeks);
    currentWeek = Math.max(currentWeek, 1);

    return {
        academicYear: config.academicYear,
        currentSemester,
        currentWeek,
        weekCount: maxWeeks,
        isVacation: false,
        periods: [
            { periodNumber: 1, weekCount: config.semester1.weeks },
            { periodNumber: 2, weekCount: config.semester2.weeks },
        ]
    };
}

/**
 * Получить дату начала указанной недели семестра (async)
 */
async function getWeekStartDate(semester, week) {
    const dbYear = await loadActiveAcademicYear();
    let startDate;

    if (dbYear && dbYear.periods && dbYear.periods.length > 0) {
        // Find the matching period
        const period = dbYear.periods.find(p => p.periodNumber === semester);
        if (period) {
            startDate = new Date(period.startDate);
        } else {
            // Fallback to first period if missing
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

/**
 * Получить все даты для указанной недели (async)
 */
async function getWeekDates(semester, week) {
    const monday = await getWeekStartDate(semester, week);
    const dates = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates[days[i]] = date.toISOString().split('T')[0];
    }
    return dates;
}

module.exports = {
    getAcademicYearConfig,
    getCurrentWeekAndSemester,
    getCurrentWeekAndSemesterAsync,
    getWeekStartDate,
    getWeekDates,
};
