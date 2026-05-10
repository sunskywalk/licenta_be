function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// mutates mongoose doc in place, same sort as old controller
function sortSchedulePeriods(schedule) {
    if (!schedule?.periods?.length) return;
    schedule.periods.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

module.exports = {
    timeToMinutes,
    sortSchedulePeriods,
};
