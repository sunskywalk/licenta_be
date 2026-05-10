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

module.exports = {
    getCachedAcademicYear,
    getCacheTimestamp,
    setCachedAcademicYear,
};
