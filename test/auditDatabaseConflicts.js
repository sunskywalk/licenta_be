// test/auditDatabaseConflicts.js
// Скрипт для проверки существующих расписаний в базе данных на конфликты
// Запуск: node test/auditDatabaseConflicts.js

require('dotenv').config();
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Classroom = require('../models/Classroom');
const User = require('../models/User');


console.log('🔍 Аудит расписаний в базе данных на конфликты\n');
console.log('='.repeat(70));

// Helper для конвертации времени
const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

// Функция проверки конфликтов (упрощенная версия из контроллера)
const findConflicts = (schedules) => {
    const conflicts = [];

    // Группируем расписания по day/week/semester/year
    const grouped = {};

    for (const schedule of schedules) {
        const key = `${schedule.dayOfWeek}-${schedule.week}-${schedule.semester}-${schedule.year}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(schedule);
    }

    // Проверяем конфликты внутри каждой группы
    for (const [key, groupSchedules] of Object.entries(grouped)) {
        for (let i = 0; i < groupSchedules.length; i++) {
            const schedule1 = groupSchedules[i];

            for (let j = i + 1; j < groupSchedules.length; j++) {
                const schedule2 = groupSchedules[j];

                // Проверяем каждую пару периодов
                for (const period1 of schedule1.periods) {
                    for (const period2 of schedule2.periods) {
                        const start1 = timeToMinutes(period1.startTime);
                        const end1 = timeToMinutes(period1.endTime);
                        const start2 = timeToMinutes(period2.startTime);
                        const end2 = timeToMinutes(period2.endTime);

                        const timesOverlap = (start1 < end2 && end1 > start2);

                        if (timesOverlap) {
                            // Конфликт учителя
                            if (period1.teacherId.toString() === period2.teacherId.toString()) {
                                conflicts.push({
                                    type: 'TEACHER_CONFLICT',
                                    dayOfWeek: schedule1.dayOfWeek,
                                    week: schedule1.week,
                                    semester: schedule1.semester,
                                    year: schedule1.year,
                                    time: `${period1.startTime}-${period1.endTime} vs ${period2.startTime}-${period2.endTime}`,
                                    teacher: period1.teacherId,
                                    class1: schedule1.classId,
                                    class2: schedule2.classId,
                                    subject1: period1.subject,
                                    subject2: period2.subject
                                });
                            }

                            // Конфликт класса (один класс не может иметь 2 урока одновременно)
                            if (schedule1.classId.toString() === schedule2.classId.toString()) {
                                conflicts.push({
                                    type: 'CLASS_CONFLICT',
                                    dayOfWeek: schedule1.dayOfWeek,
                                    week: schedule1.week,
                                    semester: schedule1.semester,
                                    year: schedule1.year,
                                    time: `${period1.startTime}-${period1.endTime} vs ${period2.startTime}-${period2.endTime}`,
                                    class: schedule1.classId,
                                    subject1: period1.subject,
                                    subject2: period2.subject,
                                    teacher1: period1.teacherId,
                                    teacher2: period2.teacherId
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    return conflicts;
};

// Функция проверки валидности времени
const checkTimeValidity = (schedules) => {
    const invalidTimes = [];

    for (const schedule of schedules) {
        for (const period of schedule.periods) {
            // Проверка формата
            const timeFormat = /^([01]?\d|2[0-3]):([0-5]\d)$/;
            if (!timeFormat.test(period.startTime)) {
                invalidTimes.push({
                    type: 'INVALID_FORMAT_START',
                    scheduleId: schedule._id,
                    classId: schedule.classId,
                    time: period.startTime,
                    subject: period.subject
                });
            }
            if (!timeFormat.test(period.endTime)) {
                invalidTimes.push({
                    type: 'INVALID_FORMAT_END',
                    scheduleId: schedule._id,
                    classId: schedule.classId,
                    time: period.endTime,
                    subject: period.subject
                });
            }

            // Проверка порядка времени
            if (timeToMinutes(period.endTime) <= timeToMinutes(period.startTime)) {
                invalidTimes.push({
                    type: 'INVALID_ORDER',
                    scheduleId: schedule._id,
                    classId: schedule.classId,
                    startTime: period.startTime,
                    endTime: period.endTime,
                    subject: period.subject
                });
            }
        }
    }

    return invalidTimes;
};

// Главная функция
const runAudit = async () => {
    try {
        console.log('\n📡 Подключение к MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Подключено!\n');

        console.log('📥 Загрузка расписаний из базы данных...');
        const schedules = await Schedule.find({})
            .populate('classId', 'name')
            .populate('periods.teacherId', 'name');

        console.log(`✅ Загружено ${schedules.length} расписаний\n`);
        console.log('='.repeat(70));

        // Статистика
        const stats = {
            totalSchedules: schedules.length,
            totalPeriods: schedules.reduce((sum, s) => sum + s.periods.length, 0),
            semesters: [...new Set(schedules.map(s => s.semester))],
            years: [...new Set(schedules.map(s => s.year))],
            weeks: [...new Set(schedules.map(s => s.week))],
            classes: [...new Set(schedules.map(s => s.classId?.name || 'Unknown'))],
        };

        console.log('\n📊 Статистика базы данных:');
        console.log(`\n   📅 Всего расписаний: ${stats.totalSchedules}`);
        console.log(`   📖 Всего уроков: ${stats.totalPeriods}`);
        console.log(`   🗓️  Семестры: ${stats.semesters.join(', ')}`);
        console.log(`   📆 Годы: ${stats.years.join(', ')}`);
        console.log(`   📍 Недели: ${stats.weeks.length} (от ${Math.min(...stats.weeks)} до ${Math.max(...stats.weeks)})`);
        console.log(`   🏫 Классы: ${stats.classes.length} (${stats.classes.slice(0, 5).join(', ')}${stats.classes.length > 5 ? '...' : ''})`);

        console.log('\n' + '='.repeat(70));
        console.log('\n🔍 Проверка #1: Валидность времени\n');

        const invalidTimes = checkTimeValidity(schedules);

        if (invalidTimes.length === 0) {
            console.log('✅ Все времена валидны (формат HH:mm, startTime < endTime)');
        } else {
            console.log(`❌ Найдено ${invalidTimes.length} проблем с временем:\n`);
            invalidTimes.forEach((issue, idx) => {
                console.log(`${idx + 1}. ${issue.type}:`);
                console.log(`   Расписание ID: ${issue.scheduleId}`);
                console.log(`   Класс: ${issue.classId?.name || 'Unknown'}`);
                console.log(`   Предмет: ${issue.subject}`);
                if (issue.type === 'INVALID_ORDER') {
                    console.log(`   Время: ${issue.startTime} → ${issue.endTime} (НЕВЕРНЫЙ ПОРЯДОК!)`);
                } else {
                    console.log(`   Время: ${issue.time} (НЕВЕРНЫЙ ФОРМАТ!)`);
                }
                console.log('');
            });
        }

        console.log('='.repeat(70));
        console.log('\n🔍 Проверка #2: Конфликты расписания\n');

        const conflicts = findConflicts(schedules);

        if (conflicts.length === 0) {
            console.log('✅ Конфликтов не найдено! База данных чиста.');
        } else {
            console.log(`❌ Найдено ${conflicts.length} конфликтов:\n`);

            const teacherConflicts = conflicts.filter(c => c.type === 'TEACHER_CONFLICT');
            const classConflicts = conflicts.filter(c => c.type === 'CLASS_CONFLICT');

            if (teacherConflicts.length > 0) {
                console.log(`⚠️  КОНФЛИКТЫ УЧИТЕЛЕЙ: ${teacherConflicts.length}\n`);
                teacherConflicts.forEach((conflict, idx) => {
                    console.log(`${idx + 1}. Учитель в двух местах одновременно:`);
                    console.log(`   Дата: ${getDayName(conflict.dayOfWeek)}, Неделя ${conflict.week}, Семестр ${conflict.semester}, ${conflict.year}`);
                    console.log(`   Время: ${conflict.time}`);
                    console.log(`   Класс 1: ${conflict.class1?.name || 'Unknown'} (${conflict.subject1})`);
                    console.log(`   Класс 2: ${conflict.class2?.name || 'Unknown'} (${conflict.subject2})`);
                    console.log('');
                });
            }

            if (classConflicts.length > 0) {
                console.log(`⚠️  КОНФЛИКТЫ КЛАССОВ: ${classConflicts.length}\n`);
                classConflicts.forEach((conflict, idx) => {
                    console.log(`${idx + 1}. Класс имеет 2 урока одновременно:`);
                    console.log(`   Дата: ${getDayName(conflict.dayOfWeek)}, Неделя ${conflict.week}, Семестр ${conflict.semester}, ${conflict.year}`);
                    console.log(`   Время: ${conflict.time}`);
                    console.log(`   Класс: ${conflict.class?.name || 'Unknown'}`);
                    console.log(`   Урок 1: ${conflict.subject1}`);
                    console.log(`   Урок 2: ${conflict.subject2}`);
                    console.log('');
                });
            }
        }

        console.log('='.repeat(70));
        console.log('\n📋 Итоговый отчет:\n');
        console.log(`   📅 Проверено расписаний: ${stats.totalSchedules}`);
        console.log(`   ⏰ Проблем с временем: ${invalidTimes.length}`);
        console.log(`   ⚠️  Конфликтов учителей: ${conflicts.filter(c => c.type === 'TEACHER_CONFLICT').length}`);
        console.log(`   ⚠️  Конфликтов классов: ${conflicts.filter(c => c.type === 'CLASS_CONFLICT').length}`);
        console.log(`   📊 Всего проблем: ${invalidTimes.length + conflicts.length}\n`);

        if (invalidTimes.length === 0 && conflicts.length === 0) {
            console.log('🎉 База данных в отличном состоянии! Конфликтов не обнаружено.\n');
        } else {
            console.log('⚠️  Рекомендуется исправить найденные проблемы.\n');
        }

    } catch (error) {
        console.error('❌ Ошибка при аудите:', error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Отключение от базы данных...\n');
    }
};

// Helper для названий дней
const getDayName = (dayNum) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[dayNum] || `День ${dayNum}`;
};

// Запуск
runAudit()
    .then(() => {
        console.log('✅ Аудит завершен');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Критическая ошибка:', err);
        process.exit(1);
    });
