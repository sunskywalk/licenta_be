const mongoose = require('mongoose');
const Grade = require('./models/Grade');
const User = require('./models/User');
const Classroom = require('./models/Classroom');

// Маппинг предметов к кодам учителей (как в расписании)
const subjectToTeacherMapping = {
  'Mathematics': ['Prof_Math_1', 'Prof_Math_2', 'Prof_Math_3', 'Prof_Math_4'],
  'Romanian': ['Prof_ROM_1', 'Prof_ROM_2', 'Prof_ROM_3'], 
  'English': ['Prof_ENG_1', 'Prof_ENG_2', 'Prof_ENG_3'],
  'French': ['Prof_FR'],
  'Physics': ['Prof_FIZ'],
  'Chemistry': ['Prof_CHIM'],
  'Biology': ['Prof_BIO'],
  'History': ['Prof_IST'],
  'Geography': ['Prof_GEO'],
  'Computer Science': ['Prof_TIC'],
  'Art': ['Prof_ART'],
  'Music': ['Prof_MUZ'],
  'Physical Education': ['Prof_EF_1', 'Prof_EF_2']
};

async function fixGradesTeachers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/schoolCatalog', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Получаем всех учителей с их кодами
    const teachers = await User.find({ role: 'teacher' });
    const teacherMap = {};
    teachers.forEach(teacher => {
      teacherMap[teacher.teacherCode] = teacher._id;
    });

    console.log(`👨‍🏫 Found ${teachers.length} teachers`);
    console.log('📋 Teacher codes:', Object.keys(teacherMap));

    // Получаем все оценки без учителей или с неправильными учителями
    const grades = await Grade.find({}).populate('classId', 'name');
    console.log(`📊 Found ${grades.length} total grades`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const grade of grades) {
      const subject = grade.subject;
      const className = grade.classId?.name;
      
      // Находим подходящего учителя для предмета
      const teacherCodes = subjectToTeacherMapping[subject];
      if (!teacherCodes) {
        console.log(`❌ No teacher mapping for subject: ${subject}`);
        errorCount++;
        continue;
      }

      // Выбираем учителя на основе класса (как в расписании)
      let selectedTeacherCode;
      
      if (subject === 'Mathematics') {
        if (['5A', '5B'].includes(className)) selectedTeacherCode = 'Prof_Math_1';
        else if (['6A', '6B'].includes(className)) selectedTeacherCode = 'Prof_Math_2';
        else if (['7A', '7B', '8A', '8B'].includes(className)) selectedTeacherCode = 'Prof_Math_3';
        else if (['9A', '9B'].includes(className)) selectedTeacherCode = 'Prof_Math_4';
      } else if (subject === 'Romanian') {
        if (['5A', '5B', '6A', '6B'].includes(className)) selectedTeacherCode = 'Prof_ROM_1';
        else if (['7A', '7B', '8A'].includes(className)) selectedTeacherCode = 'Prof_ROM_2';
        else if (['9A', '9B'].includes(className)) selectedTeacherCode = 'Prof_ROM_3';
      } else if (subject === 'English') {
        if (['5A', '5B', '6A', '6B'].includes(className)) selectedTeacherCode = 'Prof_ENG_1';
        else if (['7A', '7B', '8A', '8B'].includes(className)) selectedTeacherCode = 'Prof_ENG_2';
        else if (['9A', '9B'].includes(className)) selectedTeacherCode = 'Prof_ENG_3';
      } else if (subject === 'Physical Education') {
        if (['5A', '5B', '6A', '6B'].includes(className)) selectedTeacherCode = 'Prof_EF_1';
        else selectedTeacherCode = 'Prof_EF_2';
      } else {
        // Для остальных предметов используем первого учителя
        selectedTeacherCode = teacherCodes[0];
      }

      if (!selectedTeacherCode || !teacherMap[selectedTeacherCode]) {
        console.log(`❌ No teacher found for ${subject} in class ${className}`);
        errorCount++;
        continue;
      }

      const teacherId = teacherMap[selectedTeacherCode];
      
      // Обновляем оценку
      try {
        await Grade.findByIdAndUpdate(grade._id, { teacher: teacherId });
        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`✅ Updated ${updatedCount} grades...`);
        }
      } catch (error) {
        console.error(`❌ Error updating grade ${grade._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Grade teacher assignment completed!`);
    console.log(`✅ Updated grades: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    // Проверяем результат для Daniela
    const daniela = await User.findOne({ teacherCode: 'Prof_ROM_3' });
    if (daniela) {
      const danielaGrades = await Grade.countDocuments({ teacher: daniela._id });
      console.log(`\n👩‍🏫 Daniela Vasile (Prof_ROM_3) now has: ${danielaGrades} grades`);
      
      const danielaSubjects = await Grade.distinct('subject', { teacher: daniela._id });
      console.log(`📚 Her subjects: ${danielaSubjects.join(', ')}`);
    }

    // Общая статистика по учителям
    console.log('\n📊 Grades per teacher:');
    for (const teacher of teachers) {
      const gradeCount = await Grade.countDocuments({ teacher: teacher._id });
      if (gradeCount > 0) {
        console.log(`  ${teacher.teacherCode}: ${gradeCount} grades`);
      }
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

// Запускаем скрипт
fixGradesTeachers(); 