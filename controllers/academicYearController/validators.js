const { VALID_PRESET_TYPES } = require('./constants');

function isEndDateAfterStartDate(startDate, endDate) {
    return new Date(endDate) > new Date(startDate);
}

function isValidPresetType(presetType) {
    return VALID_PRESET_TYPES.includes(presetType);
}

module.exports = {
    isEndDateAfterStartDate,
    isValidPresetType,
};
