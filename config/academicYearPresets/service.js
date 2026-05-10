const { PRESETS, PRESET_UI_ITEMS } = require('./constants');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function generatePeriodsFromPreset(presetType, yearStart, yearEnd) {
    const preset = PRESETS[presetType];
    if (!preset) {
        throw new Error(`Unknown preset: ${presetType}`);
    }

    // use exact year start/end dates
    const start = new Date(yearStart);
    const end = new Date(yearEnd);

    const totalMs = end.getTime() - start.getTime();
    const totalDays = Math.ceil(totalMs / MS_PER_DAY);

    const periods = [];
    let currentOffset = 0;

    for (let index = 0; index < preset.periods.length; index++) {
        const periodTemplate = preset.periods[index];
        const isLastPeriod = index === preset.periods.length - 1;

        const daysInPeriod = Math.floor(totalDays * periodTemplate.percentOfYear);

        const periodStart = new Date(start);
        periodStart.setDate(periodStart.getDate() + currentOffset);

        let periodEnd;
        if (isLastPeriod) {
            periodEnd = new Date(end);
        } else {
            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodEnd.getDate() + daysInPeriod - 1);
            if (periodEnd > end) {
                periodEnd = new Date(end);
            }
        }

        periods.push({
            periodNumber: periodTemplate.periodNumber,
            name: { ...periodTemplate.name },
            startDate: periodStart,
            endDate: periodEnd,
        });

        currentOffset += daysInPeriod;
    }

    return periods;
}

function getPresetsForUI() {
    return PRESET_UI_ITEMS.map((item) => ({
        type: item.type,
        label: { ...item.label },
        periodCount: item.periodCount,
    }));
}

module.exports = {
    generatePeriodsFromPreset,
    getPresetsForUI,
};
