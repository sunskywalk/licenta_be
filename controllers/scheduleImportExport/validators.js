function isValidSchedulesPayload(schedules) {
    return Array.isArray(schedules) && schedules.length > 0;
}

module.exports = {
    isValidSchedulesPayload,
};
