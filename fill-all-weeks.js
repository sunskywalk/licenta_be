const mongoose = require('mongoose');
const Schedule = require('./models/Schedule');

async function fillAllWeeks() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/schoolCatalog', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[OK] Connected to MongoDB');

    // Получаем все существующие расписания
    const existingSchedules = await Schedule.find({});
    console.log(`[INFO] Found ${existingSchedules.length} existing schedules`);

    // Группируем по классам и дням
    const schedulesByClassAndDay = {};
    existingSchedules.forEach(schedule => {
      const key = `${schedule.classId}_${schedule.dayOfWeek}_${schedule.semester}`;
      if (!schedulesByClassAndDay[key]) {
        schedulesByClassAndDay[key] = [];
      }
      schedulesByClassAndDay[key].push(schedule);
    });

    console.log(`[INFO] Found ${Object.keys(schedulesByClassAndDay).length} unique class-day combinations`);

    let createdCount = 0;
    let skippedCount = 0;

    // Для каждого семестра создаем 16 недель
    for (let semester = 1; semester <= 2; semester++) {
      console.log(`\n[INFO] Processing semester ${semester}...`);

      for (let week = 1; week <= 16; week++) {
        console.log(`[INFO] Processing week ${week}...`);

        // Проходим по всем уникальным комбинациям класс-день
        for (const [key, schedules] of Object.entries(schedulesByClassAndDay)) {
          const [classId, dayOfWeek, originalSemester] = key.split('_');

          // Пропускаем если это не текущий семестр
          if (parseInt(originalSemester) !== semester) continue;

          // Берем первое расписание как шаблон
          const templateSchedule = schedules[0];

          // Проверяем, есть ли уже расписание для этой недели
          const existingWeekSchedule = await Schedule.findOne({
            classId: templateSchedule.classId,
            dayOfWeek: parseInt(dayOfWeek),
            week: week,
            semester: semester,
            year: templateSchedule.year
          });

          if (existingWeekSchedule) {
            skippedCount++;
            continue;
          }

          // Создаем новое расписание для этой недели
          const newSchedule = new Schedule({
            classId: templateSchedule.classId,
            dayOfWeek: parseInt(dayOfWeek),
            week: week,
            semester: semester,
            year: templateSchedule.year,
            periods: templateSchedule.periods.map(period => ({
              startTime: period.startTime,
              endTime: period.endTime,
              subject: period.subject,
              teacherId: period.teacherId,
              room: period.room
            }))
          });

          await newSchedule.save();
          createdCount++;
        }
      }
    }

    console.log(`\n[SUCCESS] Filling completed!`);
    console.log(`[OK] Created schedules: ${createdCount}`);
    console.log(`[SKIP] Skipped existing: ${skippedCount}`);

    // Проверяем результат
    const totalSchedules = await Schedule.countDocuments();
    console.log(`[INFO] Total schedules in database: ${totalSchedules}`);

    // Показываем статистику по неделям
    console.log('\n[INFO] Schedules per week:');
    for (let week = 1; week <= 16; week++) {
      const weekCount = await Schedule.countDocuments({ week: week });
      console.log(`  Week ${week}: ${weekCount} schedules`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('[ERROR] Error:', error);
    mongoose.connection.close();
  }
}

// Запускаем скрипт
fillAllWeeks(); 