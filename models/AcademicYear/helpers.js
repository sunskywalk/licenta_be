const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Same math as the old pre('validate') on periods — weekCount for a span.
 */
function computeWeekCount(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / MS_PER_DAY);
    return Math.ceil(diffDays / 7);
}

module.exports = {
    computeWeekCount,
};
