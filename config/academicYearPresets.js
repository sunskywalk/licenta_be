// config/academicYearPresets.js
// Пресеты для быстрой настройки учебного года

const PRESETS = {
    semesters: {
        systemType: 'semesters',
        periodCount: 2,
        periods: [
            {
                periodNumber: 1,
                percentOfYear: 0.51,
                name: {
                    ro: 'Semestrul I',
                    ru: 'Первый семестр',
                    en: 'First Semester',
                },
            },
            {
                periodNumber: 2,
                percentOfYear: 0.49,
                name: {
                    ro: 'Semestrul II',
                    ru: 'Второй семестр',
                    en: 'Second Semester',
                },
            },
        ],
    },

    trimesters: {
        systemType: 'trimesters',
        periodCount: 3,
        periods: [
            {
                periodNumber: 1,
                percentOfYear: 0.33,
                name: {
                    ro: 'Trimestrul I',
                    ru: 'Первый триместр',
                    en: 'First Trimester',
                },
            },
            {
                periodNumber: 2,
                percentOfYear: 0.33,
                name: {
                    ro: 'Trimestrul II',
                    ru: 'Второй триместр',
                    en: 'Second Trimester',
                },
            },
            {
                periodNumber: 3,
                percentOfYear: 0.34,
                name: {
                    ro: 'Trimestrul III',
                    ru: 'Третий триместр',
                    en: 'Third Trimester',
                },
            },
        ],
    },

    quarters: {
        systemType: 'quarters',
        periodCount: 4,
        periods: [
            {
                periodNumber: 1,
                percentOfYear: 0.25,
                name: {
                    ro: 'Trimestrul I',
                    ru: 'Первая четверть',
                    en: 'First Quarter',
                },
            },
            {
                periodNumber: 2,
                percentOfYear: 0.25,
                name: {
                    ro: 'Trimestrul II',
                    ru: 'Вторая четверть',
                    en: 'Second Quarter',
                },
            },
            {
                periodNumber: 3,
                percentOfYear: 0.25,
                name: {
                    ro: 'Trimestrul III',
                    ru: 'Третья четверть',
                    en: 'Third Quarter',
                },
            },
            {
                periodNumber: 4,
                percentOfYear: 0.25,
                name: {
                    ro: 'Trimestrul IV',
                    ru: 'Четвёртая четверть',
                    en: 'Fourth Quarter',
                },
            },
        ],
    },
};

/**
 * Генерирует даты периодов на основе пресета и границ года
 * @param {string} presetType - 'semesters' | 'trimesters' | 'quarters'
 * @param {Date} yearStart - Дата начала учебного года
 * @param {Date} yearEnd - Дата окончания учебного года
 * @returns {Array} - Массив периодов с датами
 */
const generatePeriodsFromPreset = (presetType, yearStart, yearEnd) => {
    const preset = PRESETS[presetType];
    if (!preset) {
        throw new Error(`Unknown preset: ${presetType}`);
    }

    // Use exact dates from year - don't modify them
    const start = new Date(yearStart);
    const end = new Date(yearEnd);

    // Calculate total days in the year
    const totalMs = end.getTime() - start.getTime();
    const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));

    const periods = [];
    let currentOffset = 0; // Days offset from start

    for (let i = 0; i < preset.periods.length; i++) {
        const periodTemplate = preset.periods[i];
        const isLastPeriod = (i === preset.periods.length - 1);

        // Calculate days for this period
        const daysInPeriod = Math.floor(totalDays * periodTemplate.percentOfYear);

        // Period start: year start + offset days
        const periodStart = new Date(start);
        periodStart.setDate(periodStart.getDate() + currentOffset);

        let periodEnd;
        if (isLastPeriod) {
            // Last period always ends exactly at year end
            periodEnd = new Date(end);
        } else {
            // Period end: periodStart + daysInPeriod - 1
            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodEnd.getDate() + daysInPeriod - 1);

            // Ensure we don't exceed year end
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

        // Next period starts the day after this one ends
        currentOffset += daysInPeriod;
    }

    return periods;
};

/**
 * Получить список доступных пресетов для UI
 */
const getPresetsForUI = () => {
    return [
        {
            type: 'semesters',
            label: {
                ro: 'Semestre (2 perioade)',
                ru: 'Семестры (2 периода)',
                en: 'Semesters (2 periods)',
            },
            periodCount: 2,
        },
        {
            type: 'trimesters',
            label: {
                ro: 'Trimestre (3 perioade)',
                ru: 'Триместры (3 периода)',
                en: 'Trimesters (3 periods)',
            },
            periodCount: 3,
        },
        {
            type: 'quarters',
            label: {
                ro: 'Trimestre (4 perioade)',
                ru: 'Четверти (4 периода)',
                en: 'Quarters (4 periods)',
            },
            periodCount: 4,
        },
        {
            type: 'custom',
            label: {
                ro: 'Personalizat',
                ru: 'Свой вариант',
                en: 'Custom',
            },
            periodCount: null,
        },
    ];
};

module.exports = {
    PRESETS,
    generatePeriodsFromPreset,
    getPresetsForUI,
};
