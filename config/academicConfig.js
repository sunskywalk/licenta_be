// config/academicConfig.js
// Конфигурация учебного года для системы расписания

/**
 * Получить конфигурацию текущего учебного года
 * Учебный год: сентябрь - июнь
 */
function getAcademicYearConfig() {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    // Учебный год начинается в сентябре
    // Если сейчас сентябрь-декабрь: academicYear = currentYear
    // Если сейчас январь-август: academicYear = currentYear - 1
    const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1;

    return {
        academicYear, // Например: 2024 означает 2024-2025 учебный год

        // Семестр 1: сентябрь - январь
        semester1: {
            start: new Date(academicYear, 8, 2), // 2 сентября
            end: new Date(academicYear + 1, 0, 17), // 17 января
            weeks: 16,
        },

        // Семестр 2: январь - июнь
        semester2: {
            start: new Date(academicYear + 1, 0, 27), // 27 января
            end: new Date(academicYear + 1, 5, 20), // 20 июня
            weeks: 16,
        },
    };
}

/**
 * Определить текущий семестр и неделю
 */
function getCurrentWeekAndSemester() {
    const now = new Date();
    const config = getAcademicYearConfig();

    let currentSemester = null;
    let currentWeek = null;
    let semesterStart = null;

    // Проверяем, в каком семестре мы находимся
    if (now >= config.semester1.start && now <= config.semester1.end) {
        currentSemester = 1;
        semesterStart = config.semester1.start;
    } else if (now >= config.semester2.start && now <= config.semester2.end) {
        currentSemester = 2;
        semesterStart = config.semester2.start;
    } else {
        // Вне учебного года (каникулы)
        // Возвращаем ближайший семестр
        if (now < config.semester1.start) {
            currentSemester = 1;
            currentWeek = 1;
            return {
                academicYear: config.academicYear,
                currentSemester,
                currentWeek,
                isVacation: true
            };
        } else if (now > config.semester1.end && now < config.semester2.start) {
            // Зимние каникулы
            currentSemester = 2;
            currentWeek = 1;
            return {
                academicYear: config.academicYear,
                currentSemester,
                currentWeek,
                isVacation: true
            };
        } else {
            // Летние каникулы
            currentSemester = 1;
            currentWeek = 1;
            return {
                academicYear: config.academicYear + 1,
                currentSemester,
                currentWeek,
                isVacation: true
            };
        }
    }

    // Вычисляем номер недели
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffMs = now.getTime() - semesterStart.getTime();
    currentWeek = Math.floor(diffMs / msPerWeek) + 1;

    // Ограничиваем до 16 недель
    currentWeek = Math.min(currentWeek, 16);
    currentWeek = Math.max(currentWeek, 1);

    return {
        academicYear: config.academicYear,
        currentSemester,
        currentWeek,
        isVacation: false,
    };
}

/**
 * Получить дату начала указанной недели семестра
 * @param {number} semester - Номер семестра (1 или 2)
 * @param {number} week - Номер недели (1-16)
 * @returns {Date} - Дата понедельника этой недели
 */
function getWeekStartDate(semester, week) {
    const config = getAcademicYearConfig();
    const semesterConfig = semester === 1 ? config.semester1 : config.semester2;

    const startDate = new Date(semesterConfig.start);
    // Находим понедельник первой недели
    const dayOfWeek = startDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
    startDate.setDate(startDate.getDate() + daysToMonday);

    // Добавляем нужное количество недель
    startDate.setDate(startDate.getDate() + (week - 1) * 7);

    return startDate;
}

/**
 * Получить все даты для указанной недели
 * @param {number} semester - Номер семестра
 * @param {number} week - Номер недели
 * @returns {Object} - Даты для каждого дня недели
 */
function getWeekDates(semester, week) {
    const monday = getWeekStartDate(semester, week);

    const dates = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates[days[i]] = date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    return dates;
}

module.exports = {
    getAcademicYearConfig,
    getCurrentWeekAndSemester,
    getWeekStartDate,
    getWeekDates,
};
