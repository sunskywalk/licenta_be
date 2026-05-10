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

const PRESET_UI_ITEMS = [
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

module.exports = {
    PRESETS,
    PRESET_UI_ITEMS,
};
