const AcademicYear = require('../../models/AcademicYear');
const { CACHE_TTL, DEFAULT_PERIOD_WEEK_COUNT, MS_PER_WEEK } = require('./constants');
const { getCachedAcademicYear, getCacheTimestamp, setCachedAcademicYear } = require('./cacheStore');
const { getCurrentWeekAndSemester } = require('./fallbackConfig');

async function loadActiveAcademicYear() {
    const now = Date.now();
    if (getCachedAcademicYear() && (now - getCacheTimestamp()) < CACHE_TTL) {
        return getCachedAcademicYear();
    }

    try {
        const activeYear = await AcademicYear.getActive();
        if (activeYear && activeYear.periods && activeYear.periods.length > 0) {
            setCachedAcademicYear(activeYear, now);
            return activeYear;
        }
    } catch (error) {
        console.error('Error loading AcademicYear from DB:', error.message);
    }

    return null;
}

function getInfoFromDbYear(dbYear) {
    const now = new Date();
    now.setHours(12, 0, 0, 0);

    const periods = dbYear.periods.sort((a, b) => a.periodNumber - b.periodNumber);

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

    const periodStart = new Date(currentPeriod.startDate);
    periodStart.setHours(0, 0, 0, 0);

    const diffMs = now.getTime() - periodStart.getTime();
    let currentWeek = Math.floor(diffMs / MS_PER_WEEK) + 1;
    const weekCount = currentPeriod.weekCount || DEFAULT_PERIOD_WEEK_COUNT;
    currentWeek = Math.max(1, Math.min(currentWeek, weekCount));

    const periodsInfo = periods.map((period) => ({
        periodNumber: period.periodNumber,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        weekCount: period.weekCount || DEFAULT_PERIOD_WEEK_COUNT,
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

async function getCurrentWeekAndSemesterAsync() {
    const dbYear = await loadActiveAcademicYear();
    if (dbYear) {
        return getInfoFromDbYear(dbYear);
    }

    return getCurrentWeekAndSemester();
}

module.exports = {
    loadActiveAcademicYear,
    getCurrentWeekAndSemesterAsync,
};
