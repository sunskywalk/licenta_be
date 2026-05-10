function buildPeriodsSummary(semester1Weeks, semester2Weeks) {
    return [
        { periodNumber: 1, weekCount: semester1Weeks },
        { periodNumber: 2, weekCount: semester2Weeks },
    ];
}

function buildVacationResult(academicYear, currentSemester, weekCount, periods) {
    return {
        academicYear,
        currentSemester,
        currentWeek: 1,
        weekCount,
        isVacation: true,
        periods,
    };
}

module.exports = {
    buildPeriodsSummary,
    buildVacationResult,
};
