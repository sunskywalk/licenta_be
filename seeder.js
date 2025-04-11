// seeder.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('./models/User');
const Classroom = require('./models/Classroom');
const Schedule = require('./models/Schedule');
const Grade = require('./models/Grade');
const Attendance = require('./models/Attendance');
const Homework = require('./models/Homework');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/schoolCatalog';

async function seed() {
  try {
    // Подключаемся
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding...');

    // Чистим коллекции (аккуратно!)
    await User.deleteMany();
    await Classroom.deleteMany();
    await Schedule.deleteMany();
    await Grade.deleteMany();
    await Attendance.deleteMany();
    await Homework.deleteMany();
    await Notification.deleteMany();

    console.log('Collections cleared.');

    // Создаём класс 5A
    const class5A = await Classroom.create({ name: '5A' });

    // Создаём пользователей: admin, teacher, student
    const adminPass = await bcrypt.hash('admin123', 10);
    const teacherPass = await bcrypt.hash('teacher123', 10);
    const studentPass = await bcrypt.hash('student123', 10);

    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      classRooms: [],
    });

    const teacherUser = await User.create({
      name: 'John Teacher',
      email: 'teacher@example.com',
      password: teacherPass,
      role: 'teacher',
      classRooms: [class5A._id],
    });

    const studentUser = await User.create({
      name: 'Mike Student',
      email: 'student@example.com',
      password: studentPass,
      role: 'student',
      classRooms: [class5A._id],
    });

    // Обновляем класс, добавляя учителя и студента
    class5A.teachers.push(teacherUser._id);
    class5A.students.push(studentUser._id);
    await class5A.save();

    console.log('Created Users & Classroom');

    // Создаём расписание (Schedule)
    const schedule1 = await Schedule.create({
      classroom: class5A._id,
      subject: 'Matematica',
      teacher: teacherUser._id,
      dayOfWeek: 'Monday',
      startTime: '08:00',
      endTime: '08:45',
    });
    const schedule2 = await Schedule.create({
      classroom: class5A._id,
      subject: 'Romana',
      teacher: teacherUser._id,
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '09:45',
    });
    console.log('Created schedules');

    // Добавляем оценку Grade
    const grade1 = await Grade.create({
      student: studentUser._id,
      subject: 'Matematica',
      type: 'test',
      semester: 1,
      value: 8,
    });
    console.log('Created a grade');

    // Добавляем запись посещаемости
    const att1 = await Attendance.create({
      student: studentUser._id,
      subject: 'Romana',
      status: 'present',
    });
    console.log('Created attendance record');

    // Добавляем домашку
    const hw1 = await Homework.create({
      classroom: class5A._id,
      subject: 'Matematica',
      teacher: teacherUser._id,
      title: 'Tema #1',
      description: 'Rezolva problemele 1-5',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 дней
    });
    console.log('Created homework');

    // Добавляем уведомление
    const notif1 = await Notification.create({
      title: 'Test la Matematica',
      message: 'Mâine avem test la capitolul 2',
      recipients: [studentUser._id],
    });
    console.log('Created notification');

    console.log('Seeding done!');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();