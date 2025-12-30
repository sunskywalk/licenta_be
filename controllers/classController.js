// controllers/classController.js
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');

exports.createClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может создавать классы' });
    }
    const { name } = req.body;
    const existing = await Classroom.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Класс с таким названием уже существует' });
    }

    const newClass = await Classroom.create({ name });
    res.status(201).json({ message: 'Класс создан', classroom: newClass });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании класса', error: error.message });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    // Admin или teacher тоже может смотреть (например, teacherPanel)
    // Но если нужно ограничить — можете поставить checkRole
    const classes = await Classroom.find()
      .populate('teachers', '-password')
      .populate('students', '-password')
      .populate('homeroomTeacher', 'name email');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении классов', error: error.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const cls = await Classroom.findById(req.params.id)
      .populate('teachers', '-password')
      .populate('students', '-password')
      .populate('homeroomTeacher', 'name email');
    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может обновлять класс' });
    }
    const { name, teachers, students } = req.body;
    const cls = await Classroom.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }

    if (name) cls.name = name;
    if (teachers) cls.teachers = teachers;
    if (students) cls.students = students;

    await cls.save();

    // Опционально: можно синхронизировать user.classRooms
    // Для простоты опустим.

    res.json({
      message: 'Класс обновлён',
      classroom: await Classroom.findById(req.params.id)
        .populate('teachers', '-password')
        .populate('students', '-password'),
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может удалять класс' });
    }
    const cls = await Classroom.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }

    // Удаляем ссылки на класс у пользователей
    await User.updateMany(
      { classRooms: cls._id },
      { $pull: { classRooms: cls._id } }
    );

    await cls.deleteOne();

    res.json({ message: 'Класс удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении класса', error: error.message });
  }
};

// Назначить классного руководителя (admin only)
exports.assignHomeroomTeacher = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может назначать классных руководителей' });
    }

    const { id } = req.params;
    const { teacherId } = req.body;

    const cls = await Classroom.findById(id);
    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }

    // Если teacherId = null, снимаем классрука
    if (!teacherId) {
      cls.homeroomTeacher = null;
      await cls.save();
      return res.json({ message: 'Классный руководитель снят', classroom: cls });
    }

    // Проверяем, что учитель существует и является учителем
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Учитель не найден' });
    }
    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'Пользователь не является учителем' });
    }

    cls.homeroomTeacher = teacherId;
    await cls.save();

    const updatedClass = await Classroom.findById(id)
      .populate('homeroomTeacher', 'name email')
      .populate('teachers', 'name email')
      .populate('students', 'name email');

    res.json({ message: 'Классный руководитель назначен', classroom: updatedClass });
  } catch (error) {
    console.error('Error assigning homeroom teacher:', error);
    res.status(500).json({ message: 'Ошибка при назначении классного руководителя', error: error.message });
  }
};

// Получение класса с детальной статистикой
exports.getClassWithStats = async (req, res) => {
  try {
    const cls = await Classroom.findById(req.params.id)
      .populate('teachers', '-password')
      .populate('students', '-password')
      .populate('homeroomTeacher', 'name email');

    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }

    // Проверка прав: admin или классный руководитель этого класса
    const isHomeroomTeacher = cls.homeroomTeacher &&
      String(cls.homeroomTeacher._id) === String(req.user.userId);

    if (req.user.role !== 'admin' && !isHomeroomTeacher) {
      return res.status(403).json({
        message: 'Только admin или классный руководитель могут просматривать детальную статистику класса'
      });
    }

    // Получаем статистику для каждого ученика
    const studentsWithStats = [];
    let totalGrades = 0;
    let totalAttendanceRate = 0;
    let bestStudent = null;
    let bestAttendanceStudent = null;

    for (const student of cls.students) {
      // Получаем оценки ученика
      const grades = await Grade.find({ student: student._id }).populate('teacher', 'name');

      // Вычисляем средний балл
      const regularGrades = grades.filter(g => g.type !== 'final');
      const averageGrade = regularGrades.length > 0
        ? regularGrades.reduce((sum, g) => sum + g.value, 0) / regularGrades.length
        : 0;

      // Получаем посещаемость за последние 30 дней
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendanceRecords = await Attendance.find({
        student: student._id,
        date: { $gte: thirtyDaysAgo }
      });

      let attendanceRate = 0;
      if (attendanceRecords.length > 0) {
        const presentCount = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
        attendanceRate = Math.round((presentCount / attendanceRecords.length) * 100);
      }

      const studentData = {
        _id: student._id,
        name: student.name,
        email: student.email,
        grades: grades,
        averageGrade: Math.round(averageGrade * 100) / 100,
        attendanceRate: attendanceRate,
        totalGrades: grades.length
      };

      studentsWithStats.push(studentData);
      totalGrades += grades.length;
      totalAttendanceRate += attendanceRate;

      // Определяем лучшего ученика по оценкам
      if (!bestStudent || studentData.averageGrade > bestStudent.averageGrade) {
        bestStudent = studentData;
      }

      // Определяем лучшего ученика по посещаемости
      if (!bestAttendanceStudent || studentData.attendanceRate > bestAttendanceStudent.attendanceRate) {
        bestAttendanceStudent = studentData;
      }
    }

    // Сортируем учеников по алфавиту
    studentsWithStats.sort((a, b) => a.name.localeCompare(b.name));

    // Общая статистика класса
    const classStats = {
      totalStudents: cls.students.length,
      totalGrades: totalGrades,
      averageGrade: cls.students.length > 0
        ? Math.round((studentsWithStats.reduce((sum, s) => sum + s.averageGrade, 0) / cls.students.length) * 100) / 100
        : 0,
      attendanceRate: cls.students.length > 0
        ? Math.round(totalAttendanceRate / cls.students.length)
        : 0,
      bestPerformingStudent: bestStudent,
      bestAttendanceStudent: bestAttendanceStudent
    };

    res.json({
      ...cls.toObject(),
      students: studentsWithStats,
      classStats: classStats
    });
  } catch (error) {
    console.error('Error getting class with stats:', error);
    res.status(500).json({ message: 'Ошибка при получении статистики класса', error: error.message });
  }
};

// Добавление ученика в класс
exports.addStudentToClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может добавлять учеников' });
    }

    const { classId, studentId } = req.body;

    const cls = await Classroom.findById(classId);
    const student = await User.findById(studentId);

    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }

    if (!student) {
      return res.status(404).json({ message: 'Ученик не найден' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ message: 'Пользователь не является учеником' });
    }

    // Проверяем, не находится ли ученик уже в этом классе
    if (cls.students.includes(studentId)) {
      return res.status(400).json({ message: 'Ученик уже находится в этом классе' });
    }

    // Если ученик в другом классе, удаляем его оттуда
    await Classroom.updateMany(
      { students: studentId },
      { $pull: { students: studentId } }
    );

    // Добавляем ученика в новый класс
    cls.students.push(studentId);
    await cls.save();

    // Обновляем classRooms у ученика
    student.classRooms = [classId];
    await student.save();

    res.json({ message: 'Ученик успешно добавлен в класс' });
  } catch (error) {
    console.error('Error adding student to class:', error);
    res.status(500).json({ message: 'Ошибка при добавлении ученика', error: error.message });
  }
};

// Удаление ученика из класса
exports.removeStudentFromClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может удалять учеников' });
    }

    const { classId, studentId } = req.body;

    const cls = await Classroom.findById(classId);
    const student = await User.findById(studentId);

    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }

    if (!student) {
      return res.status(404).json({ message: 'Ученик не найден' });
    }

    // Проверяем, находится ли ученик в этом классе
    if (!cls.students.includes(studentId)) {
      return res.status(400).json({ message: 'Ученик не находится в этом классе' });
    }

    // Удаляем ученика из класса
    cls.students = cls.students.filter(id => id.toString() !== studentId);
    await cls.save();

    // Удаляем класс из classRooms у ученика
    student.classRooms = student.classRooms.filter(id => id.toString() !== classId);
    await student.save();

    res.json({ message: 'Ученик успешно удален из класса' });
  } catch (error) {
    console.error('Error removing student from class:', error);
    res.status(500).json({ message: 'Ошибка при удалении ученика', error: error.message });
  }
};

// Получение списка учеников без класса или всех учеников для поиска
exports.getAvailableStudents = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может просматривать список учеников' });
    }

    const { search = '', classId } = req.query;

    // Получаем всех учеников с поиском по имени
    const searchRegex = new RegExp(search, 'i');
    const students = await User.find({
      role: 'student',
      name: { $regex: searchRegex }
    }).select('name email classRooms').sort({ name: 1 });

    // Получаем информацию о классах для каждого ученика
    const studentsWithClassInfo = await Promise.all(
      students.map(async (student) => {
        let currentClass = null;

        if (student.classRooms && student.classRooms.length > 0) {
          const cls = await Classroom.findById(student.classRooms[0]).select('name');
          if (cls) {
            currentClass = {
              _id: cls._id,
              name: cls.name
            };
          }
        }

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          currentClass: currentClass,
          canAddToClass: !currentClass || currentClass._id.toString() !== classId
        };
      })
    );

    res.json(studentsWithClassInfo);
  } catch (error) {
    console.error('Error getting available students:', error);
    res.status(500).json({ message: 'Ошибка при получении списка учеников', error: error.message });
  }
};

// Получение списка всех учителей
exports.getAllTeachers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может просматривать список учителей' });
    }

    const { search = '' } = req.query;

    const searchRegex = new RegExp(search, 'i');
    const teachers = await User.find({
      role: 'teacher',
      name: { $regex: searchRegex }
    }).select('name email').sort({ name: 1 });

    res.json(teachers);
  } catch (error) {
    console.error('Error getting teachers:', error);
    res.status(500).json({ message: 'Ошибка при получении списка учителей', error: error.message });
  }
};

// Получение списка всех студентов (для создания класса)
exports.getAllStudentsForClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может просматривать список учеников' });
    }

    const { search = '' } = req.query;

    const searchRegex = new RegExp(search, 'i');
    const students = await User.find({
      role: 'student',
      name: { $regex: searchRegex }
    }).select('name email classRooms').sort({ name: 1 });

    // Получаем информацию о текущем классе для каждого ученика
    const studentsWithClassInfo = await Promise.all(
      students.map(async (student) => {
        let currentClass = null;

        if (student.classRooms && student.classRooms.length > 0) {
          const cls = await Classroom.findById(student.classRooms[0]).select('name');
          if (cls) {
            currentClass = {
              _id: cls._id,
              name: cls.name
            };
          }
        }

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          currentClass: currentClass
        };
      })
    );

    res.json(studentsWithClassInfo);
  } catch (error) {
    console.error('Error getting students for class:', error);
    res.status(500).json({ message: 'Ошибка при получении списка учеников', error: error.message });
  }
};

// Получение списка предметов
exports.getSubjectsList = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может просматривать список предметов' });
    }

    // Список основных предметов
    const subjects = [
      'Matematică',
      'Limba română',
      'Limba engleză',
      'Limba franceză',
      'Limba germană',
      'Istorie',
      'Geografie',
      'Fizică',
      'Chimie',
      'Biologie',
      'Informatică',
      'Educație fizică',
      'Educație plastică',
      'Educație muzicală',
      'Educație tehnologică',
      'Educație civică',
      'Religie',
      'Filosofie',
      'Psihologie',
      'Logică'
    ].sort();

    res.json(subjects);
  } catch (error) {
    console.error('Error getting subjects list:', error);
    res.status(500).json({ message: 'Ошибка при получении списка предметов', error: error.message });
  }
};