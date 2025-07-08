const mongoose = require('mongoose');
const Schedule = require('./models/Schedule');
const User = require('./models/User');
const Classroom = require('./models/Classroom');

// Маппинг предметов к кодам учителей
const subjectToTeacherCode = {
  'Matematica': ['Prof_Math_1', 'Prof_Math_2', 'Prof_Math_3', 'Prof_Math_4'],
  'Limba română': ['Prof_ROM_1', 'Prof_ROM_2', 'Prof_ROM_3'],
  'Engleză': ['Prof_ENG_1', 'Prof_ENG_2', 'Prof_ENG_3'],
  'Franceză': ['Prof_FR'],
  'Fizică': ['Prof_FIZ'],
  'Chimie': ['Prof_CHIM'],
  'Biologie': ['Prof_BIO'],
  'Istorie': ['Prof_IST'],
  'Geografie': ['Prof_GEO'],
  'TIC': ['Prof_TIC'],
  'Educație plastică': ['Prof_ART'],
  'Educație muzicală': ['Prof_MUZ'],
  'Tehnologii': ['Prof_TECH'],
  'Educație fizică': ['Prof_EF_1', 'Prof_EF_2'],
  'Educație religioasă': ['Prof_REL'],
  'Educație civică': ['Prof_EC']
};

// Функция для получения правильного учителя для класса и предмета
function getTeacherForClass(subject, className) {
  const teacherCodes = subjectToTeacherCode[subject];
  if (!teacherCodes) {
    console.error(`❌ No teacher found for subject: ${subject}`);
    return null;
  }

  // Логика распределения по классам
  if (subject === 'Matematica') {
    if (['5A', '5B'].includes(className)) return 'Prof_Math_1';
    if (['6A', '6B'].includes(className)) return 'Prof_Math_2';
    if (['7A', '7B', '8A', '8B'].includes(className)) return 'Prof_Math_3';
    if (['9A', '9B'].includes(className)) return 'Prof_Math_4';
  } else if (subject === 'Limba română') {
    if (['5A', '5B', '6A', '6B'].includes(className)) return 'Prof_ROM_1';
    if (['7A', '7B', '8A'].includes(className)) return 'Prof_ROM_2';
    if (['9A', '9B'].includes(className)) return 'Prof_ROM_3';
  } else if (subject === 'Engleză') {
    if (['5A', '5B', '6A', '6B'].includes(className)) return 'Prof_ENG_1';
    if (['7A', '7B', '8A', '8B'].includes(className)) return 'Prof_ENG_2';
    if (['9A', '9B'].includes(className)) return 'Prof_ENG_3';
  } else if (subject === 'Educație fizică') {
    if (['5A', '5B', '6A', '6B'].includes(className)) return 'Prof_EF_1';
    if (['7A', '7B', '8A', '8B', '9A', '9B'].includes(className)) return 'Prof_EF_2';
  } else {
    // Для остальных предметов используем первого учителя
    return teacherCodes[0];
  }
  
  return teacherCodes[0];
}

async function updateScheduleWithProperTeachers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/schoolCatalog', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Получить всех учителей для маппинга
    const teachers = await User.find({ role: 'teacher' });
    const teacherMap = {};
    teachers.forEach(teacher => {
      teacherMap[teacher.teacherCode] = teacher._id;
    });

    console.log(`📋 Found ${teachers.length} teachers in database`);

    // Получить все классы для маппинга
    const classrooms = await Classroom.find({});
    const classroomMap = {};
    classrooms.forEach(classroom => {
      classroomMap[classroom.name] = classroom._id;
    });

    console.log(`📋 Found ${classrooms.length} classrooms in database`);

    // Получить все расписания
    const schedules = await Schedule.find({}).populate('classId', 'name');
    console.log(`📅 Found ${schedules.length} schedules to update`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const schedule of schedules) {
      const className = schedule.classId.name;
      
      // Обновить каждый период в расписании
      for (let i = 0; i < schedule.periods.length; i++) {
        const period = schedule.periods[i];
        const subject = period.subject;
        
        // Получить правильного учителя для этого класса и предмета
        const teacherCode = getTeacherForClass(subject, className);
        
        if (teacherCode && teacherMap[teacherCode]) {
          const oldTeacherId = period.teacherId;
          const newTeacherId = teacherMap[teacherCode];
          
          if (oldTeacherId.toString() !== newTeacherId.toString()) {
            schedule.periods[i].teacherId = newTeacherId;
            updatedCount++;
            console.log(`✅ Updated ${className} - ${subject}: ${teacherCode}`);
          }
        } else {
          errorCount++;
          console.error(`❌ No teacher found for ${className} - ${subject}`);
        }
      }
      
      // Сохранить обновленное расписание
      await schedule.save();
    }

    console.log(`\n🎉 Schedule update completed!`);
    console.log(`✅ Updated periods: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    // Проверяем результат
    console.log('\n📊 Verification:');
    const updatedSchedules = await Schedule.find({}).populate('classId', 'name').populate('periods.teacherId', 'name teacherCode');
    
    for (const schedule of updatedSchedules) {
      console.log(`\n📅 ${schedule.classId.name} - ${schedule.dayOfWeek}:`);
      schedule.periods.forEach(period => {
        console.log(`  ${period.startTime}-${period.endTime}: ${period.subject} (${period.teacherId.teacherCode})`);
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

// Запускаем скрипт
updateScheduleWithProperTeachers(); 