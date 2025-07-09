const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Schedule = require('./models/Schedule');
const Grade = require('./models/Grade');
const Homework = require('./models/Homework');
const Classroom = require('./models/Classroom');

// Підключення до бази даних
mongoose.connect('mongodb://localhost:27017/school_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testStudentScheduleAPI() {
  try {
    console.log('🔍 Testing student schedule API...');
    
    // Находим студента
    const student = await User.findOne({ 
      role: 'student',
      classRooms: { $exists: true, $ne: [] }
    }).populate('classRooms');
    
    if (!student) {
      console.log('❌ No student found');
      return;
    }
    
    console.log('👤 Student found:', student.name);
    console.log('📚 Student classRooms:', student.classRooms.map(c => c.name));
    
    const classId = student.classRooms[0]._id;
    console.log('🏫 Using classId:', classId);
    
    // Получаем расписание для класса
    const schedules = await Schedule.find({ classId: classId })
      .populate('classId')
      .populate('periods.teacherId')
      .sort({ dayOfWeek: 1, week: 1 });
    
    console.log('📅 Found schedules:', schedules.length);
    
    if (schedules.length === 0) {
      console.log('❌ No schedules found for this class');
      return;
    }
    
    // Показываем первое расписание
    const firstSchedule = schedules[0];
    console.log('📊 First schedule:', {
      dayOfWeek: firstSchedule.dayOfWeek,
      week: firstSchedule.week,
      periodsCount: firstSchedule.periods.length
    });
    
    // Тестируем получение детальной информации урока
    if (firstSchedule.periods.length > 0) {
      const firstPeriod = firstSchedule.periods[0];
      console.log('📖 Testing lesson details for:', firstPeriod.subject);
      
      // Проверяем, есть ли оценки и домашки по этому предмету
      const grades = await Grade.find({ 
        student: student._id, 
        subject: firstPeriod.subject 
      }).sort({ createdAt: -1 });
      
      const homework = await Homework.find({ 
        subject: firstPeriod.subject 
      }).sort({ createdAt: -1 });
      
      console.log('📊 Grades found:', grades.length);
      console.log('📚 Homework found:', homework.length);
      
      if (grades.length > 0) {
        console.log('📊 First grade:', {
          value: grades[0].value,
          type: grades[0].type,
          comment: grades[0].comment || 'No comment'
        });
      }
      
      if (homework.length > 0) {
        console.log('📚 First homework:', {
          title: homework[0].title,
          description: homework[0].description || 'No description'
        });
      }
    }
    
    console.log('✅ Student schedule API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing student schedule API:', error);
  } finally {
    mongoose.connection.close();
  }
}

testStudentScheduleAPI(); 