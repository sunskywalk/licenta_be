let cachedAcademicYear = null;
let cacheTimestamp = 0;

function getCachedAcademicYear() {
    return cachedAcademicYear;
}

function getCacheTimestamp() {
    return cacheTimestamp;
}

function setCachedAcademicYear(academicYear, timestamp) {
    cachedAcademicYear = academicYear;
    cacheTimestamp = timestamp;
}

function clearCachedAcademicYear() {
    cachedAcademicYear = null;
    cacheTimestamp = 0;
}

module.exports = {
    getCachedAcademicYear,
    getCacheTimestamp,
    setCachedAcademicYear,
    clearCachedAcademicYear,
};
