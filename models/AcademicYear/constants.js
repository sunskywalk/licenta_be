/**
 * Validation strings stay Russian — same as before (API / mongoose messages).
 */
const PERIOD_FIELD_MESSAGES = {
    periodNumber: ['Номер периода обязателен'],
    startDate: ['Дата начала периода обязательна'],
    endDate: ['Дата окончания периода обязательна'],
};

const YEAR_FIELD_MESSAGES = {
    year: ['Год обязателен'],
    startDate: ['Дата начала учебного года обязательна'],
    endDate: ['Дата окончания учебного года обязательна'],
    systemType: ['Тип системы обязателен'],
};

const SYSTEM_TYPES = ['semesters', 'trimesters', 'quarters', 'custom'];

const ERROR_PERIODS_OVERLAP = 'Периоды не должны пересекаться';

function periodOutsideYearMessage(period) {
    const label = period.name && period.name.ro ? period.name.ro : period.periodNumber;
    return `Период "${label}" выходит за границы учебного года`;
}

module.exports = {
    PERIOD_FIELD_MESSAGES,
    YEAR_FIELD_MESSAGES,
    SYSTEM_TYPES,
    ERROR_PERIODS_OVERLAP,
    periodOutsideYearMessage,
};
