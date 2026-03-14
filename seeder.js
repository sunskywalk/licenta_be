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

// Реалистичные имена учеников
const studentNames = [
  'Alexandru Popescu', 'Maria Ionescu', 'Andrei Georgescu', 'Ana Dumitru', 'Mihai Stoica',
  'Elena Radu', 'Cristian Marin', 'Ioana Nistor', 'Gabriel Stancu', 'Andreea Pavel',
  'Stefan Ciobanu', 'Diana Florea', 'Razvan Moldovan', 'Bianca Diaconu', 'Adrian Lazar',
  'Raluca Oprea', 'Bogdan Serban', 'Teodora Matei', 'Vlad Barbu', 'Simona Craciun',
  'George Toma', 'Larisa Vasile', 'Dragos Neagu', 'Roxana Popa', 'Catalin Enache',
  'Denisa Badea', 'Florin Ilie', 'Oana Preda', 'Marius Ungureanu', 'Alina Manole',
  'Robert Sandu', 'Irina Mihai', 'Cosmin Alexandrescu', 'Daniela Apostol', 'Lucian Tudor',
  'Corina Luca', 'Octavian Grigore', 'Ramona Dobre', 'Sorin Tanase', 'Nicoleta Zamfir'
];

// Имена учителей
const teacherNames = [
  'Prof. Ion Marinescu', 'Prof. Ana Constantinescu', 'Prof. Gheorghe Radulescu',
  'Prof. Carmen Vasilescu', 'Prof. Petru Antonescu', 'Prof. Doina Petrescu',
  'Prof. Radu Nicolaescu', 'Prof. Lucia Mihalache'
];

// Предметы
const subjects = [
  'Mathematics', 'Romanian', 'English', 'History', 'Geography',
  'Physics', 'Chemistry', 'Biology', 'Physical Education', 'Art',
  'Music', 'Computer Science', 'French', 'German'
];

// Назначение предметов учителям (каждый учитель ведет 1-2 предмета, максимум 3)
const teacherSubjects = [
  ['Mathematics', 'Physics'], // Prof. Ion Marinescu
  ['Romanian', 'History'], // Prof. Ana Constantinescu
  ['English', 'French'], // Prof. Gheorghe Radulescu
  ['Geography', 'History'], // Prof. Carmen Vasilescu
  ['Chemistry', 'Biology'], // Prof. Petru Antonescu
  ['Art', 'Music'], // Prof. Doina Petrescu
  ['Computer Science', 'Mathematics'], // Prof. Radu Nicolaescu
  ['Physical Education', 'Biology', 'Geography'] // Prof. Lucia Mihalache - максимум 3
];

// Классы
const classNames = ['5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B'];

// Функция для генерации случайной оценки
const getRandomGrade = () => Math.floor(Math.random() * 6) + 5; // 5-10

// Функция для генерации случайной даты в прошлом
const getRandomPastDate = (daysBack = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
};

async function seed() {
  try {
    // Подключаемся
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding...');

    // Чистим коллекции
    await User.deleteMany();
    await Classroom.deleteMany();
    await Schedule.deleteMany();
    await Grade.deleteMany();
    await Attendance.deleteMany();
    await Homework.deleteMany();
    await Notification.deleteMany();

    console.log('Collections cleared.');

    // =============================
    // 1. Создаём админа
    // =============================
    const adminUser = await User.create({
      name: 'Director General',
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin',
      classRooms: [],
    });

    console.log('✅ Created admin');

    // =============================
    // 2. Создаём учителей
    // =============================
    const teachers = [];
    for (let i = 0; i < teacherNames.length; i++) {
      const teacher = await User.create({
        name: teacherNames[i],
        email: `teacher${i + 1}@school.com`,
        password: 'teacher123',
        role: 'teacher',
        classRooms: [],
      });
      teachers.push(teacher);
    }

    console.log(`✅ Created ${teachers.length} teachers`);

    // =============================
    // 3. Создаём классы
    // =============================
    const classrooms = [];
    for (let i = 0; i < classNames.length; i++) {
      const classroom = await Classroom.create({
        name: classNames[i],
        grade: parseInt(classNames[i][0]), // Первая цифра из названия класса
        teachers: [],
        students: []
      });
      classrooms.push(classroom);
    }

    console.log(`✅ Created ${classrooms.length} classrooms`);

    // =============================
    // 4. Создаём учеников и распределяем по классам
    // =============================
    const students = [];
    let studentIndex = 0;

    for (let classIndex = 0; classIndex < classrooms.length; classIndex++) {
      const studentsPerClass = Math.floor(Math.random() * 8) + 18; // 18-25 учеников в классе

      for (let i = 0; i < studentsPerClass; i++) {
        if (studentIndex >= studentNames.length) {
          // Если имена закончились, генерируем новые
          const firstName = ['Alex', 'Maria', 'Andrei', 'Ana', 'Mihai', 'Elena'][Math.floor(Math.random() * 6)];
          const lastName = ['Pop', 'Ion', 'Geo', 'Dum', 'Sto', 'Rad'][Math.floor(Math.random() * 6)];
          studentNames.push(`${firstName} ${lastName}${studentIndex}`);
        }

        const student = await User.create({
          name: studentNames[studentIndex],
          email: `student${studentIndex + 1}@school.com`,
          password: 'student123',
          role: 'student',
          classRooms: [classrooms[classIndex]._id],
        });

        students.push(student);
        classrooms[classIndex].students.push(student._id);
        studentIndex++;
      }

      await classrooms[classIndex].save();
    }

    console.log(`✅ Created ${students.length} students distributed across classes`);

    // =============================
    // 5. Назначаем учителей классам
    // =============================
    for (let i = 0; i < classrooms.length; i++) {
      // Каждому классу назначаем 3-5 учителей
      const teachersPerClass = Math.floor(Math.random() * 3) + 3;
      const assignedTeachers = [];

      for (let j = 0; j < teachersPerClass; j++) {
        let randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];

        // Избегаем дублирования
        while (assignedTeachers.includes(randomTeacher._id)) {
          randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];
        }

        assignedTeachers.push(randomTeacher._id);
        classrooms[i].teachers.push(randomTeacher._id);

        // Добавляем класс к учителю
        if (!randomTeacher.classRooms.includes(classrooms[i]._id)) {
          randomTeacher.classRooms.push(classrooms[i]._id);
          await randomTeacher.save();
        }
      }

      await classrooms[i].save();
    }

    console.log('✅ Assigned teachers to classrooms');

    // =============================
    // 6. Создаём оценки (много!)
    // =============================
    let totalGrades = 0;

    for (const classroom of classrooms) {
      const classTeachers = await User.find({ _id: { $in: classroom.teachers } });
      const classStudents = await User.find({ _id: { $in: classroom.students } });

      // Для каждого учителя в классе
      for (let teacherIndex = 0; teacherIndex < classTeachers.length; teacherIndex++) {
        const teacher = classTeachers[teacherIndex];

        // Находим индекс учителя в массиве teacherNames
        const teacherNameIndex = teacherNames.findIndex(name => name === teacher.name);

        // Если учитель найден, используем его предметы, иначе берем первые 2 предмета
        const assignedSubjects = teacherNameIndex !== -1
          ? teacherSubjects[teacherNameIndex]
          : subjects.slice(0, 2);

        console.log(`Teacher ${teacher.name} will teach: ${assignedSubjects.join(', ')}`);

        // Для каждого предмета создаём оценки всем ученикам
        for (const subject of assignedSubjects) {
          for (const student of classStudents) {
            // Создаём 3-8 обычных оценок
            const gradeCount = Math.floor(Math.random() * 6) + 3;

            for (let i = 0; i < gradeCount; i++) {
              const gradeTypes = ['homework', 'test', 'lesson', 'homework'];
              const randomType = gradeTypes[Math.floor(Math.random() * gradeTypes.length)];

              await Grade.create({
                student: student._id,
                subject: subject,
                type: randomType,
                semester: 1,
                value: getRandomGrade(),
                teacher: teacher._id,
                classId: classroom._id,
                comment: Math.random() > 0.7 ? 'Good work!' : '',
                createdAt: getRandomPastDate(60),
              });
              totalGrades++;
            }

            // Добавляем итоговую оценку (50% вероятность)
            if (Math.random() > 0.5) {
              await Grade.create({
                student: student._id,
                subject: subject,
                type: 'final',
                semester: 1,
                value: getRandomGrade(),
                teacher: teacher._id,
                classId: classroom._id,
                comment: 'Final grade for semester 1',
                createdAt: getRandomPastDate(30),
              });
              totalGrades++;
            }
          }
        }
      }
    }

    console.log(`✅ Created ${totalGrades} grades`);

    // =============================
    // 7. Создаём расписание на весь месяц
    // =============================
    let scheduleCount = 0;

    for (const classroom of classrooms) {
      const classTeachers = await User.find({ _id: { $in: classroom.teachers } });

      // Создаём расписание на 4 недели (понедельник-пятница)
      for (let week = 1; week <= 4; week++) {
        for (let day = 1; day <= 5; day++) {
          const periodsPerDay = Math.floor(Math.random() * 3) + 4; // 4-6 уроков в день
          const periods = [];

          for (let period = 0; period < periodsPerDay; period++) {
            const startHour = 8 + period;
            const teacher = classTeachers[Math.floor(Math.random() * classTeachers.length)];

            // Находим индекс учителя и берем один из его предметов
            const teacherNameIndex = teacherNames.findIndex(name => name === teacher.name);
            const assignedSubjects = teacherNameIndex !== -1
              ? teacherSubjects[teacherNameIndex]
              : subjects.slice(0, 2);

            const subject = assignedSubjects[Math.floor(Math.random() * assignedSubjects.length)];

            periods.push({
              startTime: `${startHour.toString().padStart(2, '0')}:00`,
              endTime: `${startHour.toString().padStart(2, '0')}:45`,
              subject: subject,
              teacherId: teacher._id,
              room: `Room ${Math.floor(Math.random() * 20) + 101}`
            });
          }

          await Schedule.create({
            classId: classroom._id,
            dayOfWeek: day,
            week: week,
            semester: 1,
            year: 2024,
            periods: periods
          });
          scheduleCount++;
        }
      }
    }

    console.log(`✅ Created ${scheduleCount} schedule entries`);

    // =============================
    // 8. Создаём домашние задания
    // =============================
    const homeworkTitles = [
      'Chapter Review Questions', 'Math Problems Set', 'Essay Assignment',
      'Laboratory Report', 'Reading Assignment', 'Project Presentation',
      'Grammar Exercises', 'Historical Analysis', 'Science Experiment',
      'Art Portfolio', 'Music Practice', 'Physical Exercise Plan'
    ];

    let homeworkCount = 0;

    for (const classroom of classrooms) {
      const classTeachers = await User.find({ _id: { $in: classroom.teachers } });

      // Каждый учитель создаёт 2-4 домашних задания
      for (const teacher of classTeachers) {
        const hwCount = Math.floor(Math.random() * 3) + 2;

        // Находим предметы учителя
        const teacherNameIndex = teacherNames.findIndex(name => name === teacher.name);
        const assignedSubjects = teacherNameIndex !== -1
          ? teacherSubjects[teacherNameIndex]
          : subjects.slice(0, 2);

        for (let i = 0; i < hwCount; i++) {
          const title = homeworkTitles[Math.floor(Math.random() * homeworkTitles.length)];
          const subject = assignedSubjects[Math.floor(Math.random() * assignedSubjects.length)];

          await Homework.create({
            classId: classroom._id,
            subject: subject,
            teacher: teacher._id,
            title: `${subject}: ${title}`,
            description: `Complete the assigned ${title.toLowerCase()} for ${subject}. Due next week.`,
            dueDate: new Date(Date.now() + Math.floor(Math.random() * 14 + 1) * 24 * 60 * 60 * 1000),
            createdAt: getRandomPastDate(7),
          });
          homeworkCount++;
        }
      }
    }

    console.log(`✅ Created ${homeworkCount} homework assignments`);

    // =============================
    // 9. Создаём записи посещаемости
    // =============================
    let attendanceCount = 0;

    for (const classroom of classrooms) {
      const classStudents = await User.find({ _id: { $in: classroom.students } });
      const classTeachers = await User.find({ _id: { $in: classroom.teachers } });

      // Для каждого ученика создаём записи посещаемости за последние 30 дней
      for (const student of classStudents) {
        for (let day = 0; day < 30; day++) {
          // Пропускаем выходные
          const date = new Date();
          date.setDate(date.getDate() - day);
          if (date.getDay() === 0 || date.getDay() === 6) continue;

          // 85% вероятность присутствия
          const status = Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late');
          const teacher = classTeachers[Math.floor(Math.random() * classTeachers.length)];

          // Находим предметы учителя
          const teacherNameIndex = teacherNames.findIndex(name => name === teacher.name);
          const assignedSubjects = teacherNameIndex !== -1
            ? teacherSubjects[teacherNameIndex]
            : subjects.slice(0, 2);

          const subject = assignedSubjects[Math.floor(Math.random() * assignedSubjects.length)];

          await Attendance.create({
            student: student._id,
            subject: subject,
            status: status,
            date: date,
            teacher: teacher._id,
            classId: classroom._id,
          });
          attendanceCount++;
        }
      }
    }

    console.log(`✅ Created ${attendanceCount} attendance records`);

    // =============================
    // 10. Создаём уведомления
    // =============================
    const notificationTitles = [
      'Test Announcement', 'School Event', 'Holiday Notice', 'Parent Meeting',
      'Field Trip', 'Sports Competition', 'Art Exhibition', 'Science Fair',
      'Library Hours', 'Cafeteria Menu', 'Weather Alert', 'Schedule Change'
    ];

    let notificationCount = 0;

    // Создаём общие уведомления от админа
    for (let i = 0; i < 10; i++) {
      const title = notificationTitles[Math.floor(Math.random() * notificationTitles.length)];
      const allStudents = students.map(s => s._id);

      await Notification.create({
        title: title,
        message: `Important announcement regarding ${title.toLowerCase()}. Please check with your teachers for more details.`,
        type: ['info', 'warning', 'success'][Math.floor(Math.random() * 3)],
        recipients: allStudents.slice(0, Math.floor(Math.random() * allStudents.length) + 10),
        senderId: adminUser._id,
        createdAt: getRandomPastDate(14),
      });
      notificationCount++;
    }

    // Создаём уведомления от учителей
    for (const teacher of teachers) {
      const teacherClasses = await Classroom.find({ teachers: teacher._id });

      for (const classroom of teacherClasses) {
        const classStudents = await User.find({ _id: { $in: classroom.students } });

        // Находим предметы учителя
        const teacherNameIndex = teacherNames.findIndex(name => name === teacher.name);
        const assignedSubjects = teacherNameIndex !== -1
          ? teacherSubjects[teacherNameIndex]
          : subjects.slice(0, 2);

        // 2-3 уведомления на класс
        for (let i = 0; i < 3; i++) {
          const subject = assignedSubjects[Math.floor(Math.random() * assignedSubjects.length)];
          const title = `${subject} Update`;

          await Notification.create({
            title: title,
            message: `Class ${classroom.name}: Important update about upcoming assignments and tests.`,
            type: ['info', 'warning'][Math.floor(Math.random() * 2)],
            recipients: classStudents.map(s => s._id),
            senderId: teacher._id,
            createdAt: getRandomPastDate(7),
          });
          notificationCount++;
        }
      }
    }

    console.log(`✅ Created ${notificationCount} notifications`);

    // =============================
    // Итоговая статистика
    // =============================
    console.log('\n🎉 DATABASE SEEDING COMPLETED! 🎉');
    console.log('=====================================');
    console.log(`👨‍💼 Admin: 1`);
    console.log(`👩‍🏫 Teachers: ${teachers.length}`);
    console.log(`👨‍🎓 Students: ${students.length}`);
    console.log(`🏫 Classrooms: ${classrooms.length}`);
    console.log(`📊 Grades: ${totalGrades}`);
    console.log('\n[SUCCESS] DATABASE SEEDING COMPLETED!');
    console.log('=====================================');
    console.log(`[INFO] Admin: 1`);
    console.log(`[INFO] Teachers: ${teachers.length}`);
    console.log(`[INFO] Students: ${students.length}`);
    console.log(`[INFO] Classrooms: ${classrooms.length}`);
    console.log(`[INFO] Grades: ${totalGrades}`);
    console.log(`[INFO] Schedules: ${scheduleCount}`);
    console.log(`[INFO] Homework: ${homeworkCount}`);
    console.log(`[INFO] Attendance: ${attendanceCount}`);
    console.log(`[INFO] Notifications: ${notificationCount}`);
    console.log('=====================================');

    console.log('\n[INFO] TEACHER SUBJECTS ASSIGNMENT:');
    for (let i = 0; i < teacherNames.length; i++) {
      console.log(`${teacherNames[i]}: ${teacherSubjects[i].join(', ')}`);
    }

    console.log('\n[INFO] TEST ACCOUNTS:');
    console.log('Admin: admin@school.com / admin123');
    console.log('Teachers: teacher1@school.com to teacher8@school.com / teacher123');
    console.log('Students: student1@school.com to student[N]@school.com / student123');
    console.log('\n[INFO] Ready for testing!\n');

    process.exit();
  } catch (error) {
    console.error('[ERROR] Seeding error:', error);
    process.exit(1);
  }
}

seed();