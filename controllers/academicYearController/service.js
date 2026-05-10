const { generatePeriodsFromPreset, getPresetsForUI } = require('../../config/academicYearPresets');
const repository = require('./repository');

function buildCreatePayload(body, userId) {
    const { year, startDate, endDate, systemType, periods, isActive } = body;

    let finalPeriods = periods || [];
    if (systemType !== 'custom' && (!periods || periods.length === 0)) {
        finalPeriods = generatePeriodsFromPreset(systemType, startDate, endDate);
    }

    return {
        year,
        startDate,
        endDate,
        systemType,
        periods: finalPeriods,
        isActive: isActive || false,
        createdBy: userId,
    };
}

function applyAcademicYearUpdates(academicYear, body) {
    const { year, startDate, endDate, systemType, periods, isActive } = body;

    if (year !== undefined) academicYear.year = year;
    if (startDate !== undefined) academicYear.startDate = startDate;
    if (endDate !== undefined) academicYear.endDate = endDate;
    if (systemType !== undefined) academicYear.systemType = systemType;
    if (periods !== undefined) academicYear.periods = periods;
    if (isActive !== undefined) academicYear.isActive = isActive;
}

function generatePresetPeriods(academicYear, presetType) {
    return generatePeriodsFromPreset(
        presetType,
        academicYear.startDate,
        academicYear.endDate
    );
}

function getPresets() {
    return getPresetsForUI();
}

function buildCurrentPeriodResponse(academicYear, currentPeriod) {
    return {
        academicYear: {
            _id: academicYear._id,
            year: academicYear.year,
            displayName: academicYear.displayName,
        },
        currentPeriod,
    };
}

module.exports = {
    repository,
    buildCreatePayload,
    applyAcademicYearUpdates,
    generatePresetPeriods,
    getPresets,
    buildCurrentPeriodResponse,
};
