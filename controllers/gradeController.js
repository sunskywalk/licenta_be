// controllers/gradeController.js
const Grade = require('../models/Grade');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Classroom = require('../models/Classroom');

exports.createGrade = async (req, res) => {
  try {
    // teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав добавлять оценки' });
    }
    const { student, subject, type, semester, value, classId, comment } = req.body;

    // Учитель может ставить оценки только по своим предметам
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.userId);
      if (!teacher.subjects || !teacher.subjects.includes(subject)) {
        return res.status(403).json({
          message: `Вы не можете ставить оценки по предмету "${subject}". Ваши предметы: ${teacher.subjects?.join(', ') || 'не назначены'}`
        });
      }
    }

    const newGrade = await Grade.create({
      student,
      teacher: req.user.userId,
      classId,
      subject,
      type,
      semester,
      value,
      comment,
    });
    res.status(201).json({ message: 'Оценка создана', grade: newGrade });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.find()
      .populate('student', '-password')
      .populate('teacher', '-password')
      .populate('classId');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getGradeById = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', '-password')
      .populate('teacher', '-password')
      .populate('classId');
    if (!grade) {
      return res.status(404).json({ message: 'Оценка не найдена' });
    }
    res.json(grade);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.updateGrade = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const { student, subject, type, semester, value, classId, comment } = req.body;

    // Учитель может изменять оценки только по своим предметам
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.userId);
      const existingGrade = await Grade.findById(req.params.id);
      if (existingGrade && (!teacher.subjects || !teacher.subjects.includes(existingGrade.subject))) {
        return res.status(403).json({
          message: `Вы не можете изменять оценки по предмету "${existingGrade.subject}"`
        });
      }
    }

    const updated = await Grade.findByIdAndUpdate(
      req.params.id,
      { student, teacher: req.user.userId, classId, subject, type, semester, value, comment },
      { new: true }
    ).populate('student', '-password')
      .populate('teacher', '-password')
      .populate('classId');
    if (!updated) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Оценка обновлена', grade: updated });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.deleteGrade = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав' });
    }

    // Учитель может удалять оценки только по своим предметам
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.userId);
      const existingGrade = await Grade.findById(req.params.id);
      if (existingGrade && (!teacher.subjects || !teacher.subjects.includes(existingGrade.subject))) {
        return res.status(403).json({
          message: `Вы не можете удалять оценки по предмету "${existingGrade.subject}"`
        });
      }
    }

    const deleted = await Grade.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Оценка удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Дополнительная логика:
// Получение средней оценки
// ============================
exports.getStudentAverage = async (req, res) => {
  try {
    const { studentId } = req.params;
    // если student, смотрит только свою
    if (req.user.role === 'student' && String(req.user.userId) !== String(studentId)) {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const { subject, semester } = req.query;
    let filter = { student: studentId };
    if (subject) filter.subject = subject;
    if (semester) filter.semester = Number(semester);

    const grades = await Grade.find(filter)
      .populate('student', '-password')
      .populate('teacher', '-password')
      .populate('classId');
    if (!grades.length) {
      return res.json({ average: 0, count: 0 });
    }
    const sum = grades.reduce((acc, g) => acc + g.value, 0);
    const avg = sum / grades.length;
    res.json({ average: avg.toFixed(2), count: grades.length, details: grades });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Итоговая оценка (среднее из 2 семестров)
// ============================
exports.getFinalAverage = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (req.user.role === 'student' && String(req.user.userId) !== String(studentId)) {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const { subject } = req.query;
    let filter = { student: studentId };
    if (subject) filter.subject = subject;

    const allGrades = await Grade.find(filter)
      .populate('student', '-password')
      .populate('teacher', '-password')
      .populate('classId');
    const sem1 = allGrades.filter(g => g.semester === 1);
    const sem2 = allGrades.filter(g => g.semester === 2);

    const avg1 = sem1.length ? sem1.reduce((acc, g) => acc + g.value, 0) / sem1.length : 0;
    const avg2 = sem2.length ? sem2.reduce((acc, g) => acc + g.value, 0) / sem2.length : 0;

    const finalAvg = (avg1 + avg2) / 2;

    res.json({
      averageSemester1: avg1.toFixed(2),
      averageSemester2: avg2.toFixed(2),
      finalAverage: finalAvg.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Получение оценок учителя
// ============================
exports.getTeacherGrades = async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log('[getTeacherGrades] teacherId:', teacherId, 'user:', req.user.userId, 'role:', req.user.role);

    // Админы могут смотреть оценки любого учителя
    if (req.user.role === 'admin') {
      console.log('[getTeacherGrades] Admin access granted');
    } else if (req.user.role === 'teacher') {
      if (String(req.user.userId) !== String(teacherId)) {
        console.log('[getTeacherGrades] Access denied - teacher trying to access another teacher\'s grades');
        return res.status(403).json({ message: 'Нет прав - учитель может смотреть только свои оценки' });
      }
      console.log('[getTeacherGrades] Teacher access granted - own grades');
    } else {
      console.log('[getTeacherGrades] Access denied - invalid role:', req.user.role);
      return res.status(403).json({ message: 'Нет прав - недопустимая роль' });
    }

    const grades = await Grade.find({ teacher: teacherId })
      .populate('student', '-password')
      .populate('teacher', '-password')
      .populate('classId');

    console.log('[getTeacherGrades] Found grades count:', grades.length);
    res.json(grades);
  } catch (error) {
    console.error('Error in getTeacherGrades:', error);
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Получение оценок студента
// ============================
exports.getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Студент может смотреть только свои оценки
    if (req.user.role === 'student' && String(req.user.userId) !== String(studentId)) {
      return res.status(403).json({ message: 'Нет прав' });
    }

    let filter = { student: studentId };

    // Учитель видит только свои предметы, если он не классный руководитель
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.userId);
      const studentUser = await User.findById(studentId);

      let isHomeroom = false;
      if (studentUser && studentUser.classRooms && studentUser.classRooms.length > 0) {
        const classroom = await Classroom.findById(studentUser.classRooms[0]);
        if (classroom && String(classroom.homeroomTeacher) === String(req.user.userId)) {
          isHomeroom = true;
        }
      }

      if (!isHomeroom) {
        // Если не классный руководитель, фильтруем по предметам
        if (teacher.subjects && teacher.subjects.length > 0) {
          filter.subject = { $in: teacher.subjects };
        } else {
          // Если предметов нет и не классрук - не видит ничего
          return res.json([]);
        }
      }
    }

    const grades = await Grade.find(filter)
      .populate('student', '-password')
      .populate('teacher', '-password')
      .populate('classId');
    res.json(grades);
  } catch (error) {
    console.error('Error in getStudentGrades:', error);
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Получение оценок по классу
// ============================
exports.getGradesByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const grades = await Grade.find({ classId })
      .populate('student', '-password')
      .populate('teacher', '-password')
      .populate('classId');
    res.json(grades);
  } catch (error) {
    console.error('Error in getGradesByClass:', error);
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Получение предметов учителя
// ============================
exports.getTeacherSubjects = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    console.log('[getTeacherSubjects] teacherId:', teacherId);

    // Получаем все уникальные предметы учителя
    const subjects = await Grade.distinct('subject', { teacher: teacherId });
    console.log('[getTeacherSubjects] Found subjects:', subjects);

    // Для каждого предмета считаем количество оценок
    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subject) => {
        const count = await Grade.countDocuments({ teacher: teacherId, subject });
        return { subject, gradeCount: count };
      })
    );

    res.json(subjectsWithCounts);
  } catch (error) {
    console.error('Error in getTeacherSubjects:', error);
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Получение предметов конкретного учителя по ID (для админов)
// ============================
exports.getTeacherSubjectsById = async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log('[getTeacherSubjectsById] teacherId:', teacherId);

    // Проверяем права - только админы могут получать предметы других учителей
    if (req.user.role !== 'admin' && req.user.userId !== teacherId) {
      return res.status(403).json({ message: 'Нет прав для получения предметов этого учителя' });
    }

    // Получаем все уникальные предметы учителя
    const subjects = await Grade.distinct('subject', { teacher: teacherId });
    console.log('[getTeacherSubjectsById] Found subjects:', subjects);

    // Для каждого предмета считаем количество оценок
    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subject) => {
        const count = await Grade.countDocuments({ teacher: teacherId, subject });
        return { subject, gradeCount: count };
      })
    );

    res.json(subjectsWithCounts);
  } catch (error) {
    console.error('Error in getTeacherSubjectsById:', error);
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Получение классов по предмету
// ============================
exports.getClassroomsForSubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const teacherId = req.user.userId;
    console.log('[getClassroomsForSubject] subject:', subject, 'teacherId:', teacherId);

    // Получаем все классы где учитель ведет данный предмет
    const classIds = await Grade.distinct('classId', {
      teacher: teacherId,
      subject: subject
    });
    console.log('[getClassroomsForSubject] Found classIds:', classIds);

    // Получаем информацию о классах с populate студентов
    const Classroom = require('../models/Classroom');
    const classrooms = await Classroom.find({ _id: { $in: classIds } })
      .populate('students', '-password')
      .populate('teachers', '-password');
    console.log('[getClassroomsForSubject] Found classrooms:', classrooms.map(c => `${c.name} (${c.students?.length || 0} students)`));

    res.json(classrooms);
  } catch (error) {
    console.error('Error in getClassroomsForSubject:', error);
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// Получить статистику оценок студента
exports.getStudentGradeStats = async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`📊 Fetching grade stats for student: ${studentId}`);

    let filter = { student: studentId };

    // Проверка прав доступа для учителя и студента
    if (req.user.role === 'student' && String(req.user.userId) !== String(studentId)) {
      return res.status(403).json({ message: 'Нет прав просматривать статистику другого студента' });
    }

    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.userId);
      const studentUser = await User.findById(studentId);

      let isHomeroom = false;
      if (studentUser && studentUser.classRooms && studentUser.classRooms.length > 0) {
        const classroom = await Classroom.findById(studentUser.classRooms[0]);
        if (classroom && String(classroom.homeroomTeacher) === String(req.user.userId)) {
          isHomeroom = true;
        }
      }

      if (!isHomeroom) {
        // Если не классный руководитель, учитываем только предметы учителя
        if (teacher.subjects && teacher.subjects.length > 0) {
          filter.subject = { $in: teacher.subjects };
        } else {
          // Если нет предметов и не классрук - пустая статистика
          return res.json({
            averageGrade: 0,
            totalGrades: 0,
            subjects: [],
            classRankByGrades: null,
            classRankByAttendance: null,
            attendanceRate: 0
          });
        }
      }
    }

    // Получаем все оценки студента (с учетом фильтра)
    const studentGrades = await Grade.find(filter).populate('student', 'name');

    if (studentGrades.length === 0) {
      return res.json({
        averageGrade: 0,
        totalGrades: 0,
        subjects: [],
        classRankByGrades: null,
        classRankByAttendance: null,
        attendanceRate: 0
      });
    }

    // Получаем студента и его класс
    const student = await User.findById(studentId);

    // Получаем одноклассников через classRooms
    let classmates = [];
    if (student.classRooms && student.classRooms.length > 0) {
      const studentClassId = student.classRooms[0];
      const classroom = await Classroom.findById(studentClassId).populate('students', '_id name');
      classmates = classroom ? classroom.students : [];
    }

    // Статистика по предметам
    const subjectStats = {};
    studentGrades.forEach(grade => {
      if (!subjectStats[grade.subject]) {
        subjectStats[grade.subject] = {
          grades: [],
          total: 0,
          count: 0,
          finalGrade: null
        };
      }

      if (grade.type === 'final') {
        subjectStats[grade.subject].finalGrade = grade.value;
      } else {
        subjectStats[grade.subject].grades.push(grade.value);
        subjectStats[grade.subject].total += grade.value;
        subjectStats[grade.subject].count++;
      }
    });

    // Рассчитываем средние оценки по предметам
    const subjects = Object.keys(subjectStats).map(subject => ({
      name: subject,
      averageGrade: subjectStats[subject].count > 0
        ? (subjectStats[subject].total / subjectStats[subject].count).toFixed(1)
        : 0,
      finalGrade: subjectStats[subject].finalGrade || null,
      totalGrades: subjectStats[subject].count
    }));

    // Общая средняя оценка
    const totalGradesSum = studentGrades
      .filter(g => g.type !== 'final')
      .reduce((sum, grade) => sum + grade.value, 0);
    const totalGradesCount = studentGrades.filter(g => g.type !== 'final').length;
    const averageGrade = totalGradesCount > 0 ? (totalGradesSum / totalGradesCount).toFixed(1) : 0;

    // Посещаемость студента
    const attendanceRecords = await Attendance.find({ student: studentId });
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // Рейтинг в классе по оценкам
    const classGradeRanking = [];
    for (const classmate of classmates) {
      const classmateGrades = await Grade.find({
        student: classmate._id,
        type: { $ne: 'final' }
      });

      if (classmateGrades.length > 0) {
        const classmateAverage = classmateGrades.reduce((sum, g) => sum + g.value, 0) / classmateGrades.length;
        classGradeRanking.push({
          studentId: classmate._id,
          name: classmate.name,
          average: classmateAverage
        });
      }
    }

    // Сортируем по убыванию средней оценки
    classGradeRanking.sort((a, b) => b.average - a.average);
    const gradeRankPosition = classGradeRanking.findIndex(r => r.studentId.toString() === studentId) + 1;

    // Рейтинг в классе по посещаемости
    const classAttendanceRanking = [];
    for (const classmate of classmates) {
      const classmateAttendance = await Attendance.find({ student: classmate._id });
      const classmateTotal = classmateAttendance.length;
      const classmatePresent = classmateAttendance.filter(a => a.status === 'present').length;
      const classmateRate = classmateTotal > 0 ? (classmatePresent / classmateTotal) * 100 : 0;

      classAttendanceRanking.push({
        studentId: classmate._id,
        name: classmate.name,
        rate: classmateRate
      });
    }

    // Сортируем по убыванию посещаемости
    classAttendanceRanking.sort((a, b) => b.rate - a.rate);
    const attendanceRankPosition = classAttendanceRanking.findIndex(r => r.studentId.toString() === studentId) + 1;

    console.log(`📈 Student stats: avg=${averageGrade}, attendance=${attendanceRate}%, gradeRank=${gradeRankPosition}, attendanceRank=${attendanceRankPosition}`);

    res.json({
      averageGrade: parseFloat(averageGrade),
      totalGrades: totalGradesCount,
      subjects: subjects,
      classRankByGrades: gradeRankPosition,
      classRankByAttendance: attendanceRankPosition,
      attendanceRate: attendanceRate,
      totalClassmates: classmates.length
    });

  } catch (error) {
    console.error('Error fetching student grade stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Получить детальную статистику по предмету
exports.getStudentSubjectStats = async (req, res) => {
  try {
    const { studentId, subject } = req.params;

    console.log(`📚 Fetching subject stats for student: ${studentId}, subject: ${subject}`);

    // Получаем все оценки студента по предмету
    const grades = await Grade.find({
      student: studentId,
      subject: subject
    }).sort({ createdAt: -1 });

    if (grades.length === 0) {
      return res.json({
        subject: subject,
        averageGrade: 0,
        finalGrade: null,
        grades: [],
        attendanceRate: 0,
        classRankByGrades: null,
        classRankByAttendance: null
      });
    }

    // Получаем студента и его класс
    const student = await User.findById(studentId);

    // Получаем одноклассников через classRooms
    let classmates = [];
    if (student.classRooms && student.classRooms.length > 0) {
      const studentClassId = student.classRooms[0];
      const classroom = await Classroom.findById(studentClassId).populate('students', '_id name');
      classmates = classroom ? classroom.students : [];
    }

    // Разделяем оценки на обычные и итоговые
    const regularGrades = grades.filter(g => g.type !== 'final');
    const finalGrade = grades.find(g => g.type === 'final');

    // Средняя оценка по предмету
    const averageGrade = regularGrades.length > 0
      ? (regularGrades.reduce((sum, g) => sum + g.value, 0) / regularGrades.length).toFixed(1)
      : 0;

    // Посещаемость по предмету
    const attendanceRecords = await Attendance.find({
      student: studentId,
      subject: subject
    });
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // Рейтинг в классе по предмету (оценки)
    const classSubjectRanking = [];
    for (const classmate of classmates) {
      const classmateGrades = await Grade.find({
        student: classmate._id,
        subject: subject,
        type: { $ne: 'final' }
      });

      if (classmateGrades.length > 0) {
        const classmateAverage = classmateGrades.reduce((sum, g) => sum + g.value, 0) / classmateGrades.length;
        classSubjectRanking.push({
          studentId: classmate._id,
          name: classmate.name,
          average: classmateAverage
        });
      }
    }

    classSubjectRanking.sort((a, b) => b.average - a.average);
    const subjectGradeRank = classSubjectRanking.findIndex(r => r.studentId.toString() === studentId) + 1;

    // Рейтинг в классе по предмету (посещаемость)
    const classSubjectAttendanceRanking = [];
    for (const classmate of classmates) {
      const classmateAttendance = await Attendance.find({
        student: classmate._id,
        subject: subject
      });
      const classmateTotal = classmateAttendance.length;
      const classmatePresent = classmateAttendance.filter(a => a.status === 'present').length;
      const classmateRate = classmateTotal > 0 ? (classmatePresent / classmateTotal) * 100 : 0;

      classSubjectAttendanceRanking.push({
        studentId: classmate._id,
        name: classmate.name,
        rate: classmateRate
      });
    }

    classSubjectAttendanceRanking.sort((a, b) => b.rate - a.rate);
    const subjectAttendanceRank = classSubjectAttendanceRanking.findIndex(r => r.studentId.toString() === studentId) + 1;

    // Форматируем оценки для отображения
    const formattedGrades = regularGrades.map(grade => ({
      _id: grade._id,
      value: grade.value,
      type: grade.type,
      comment: grade.comment || '',
      date: grade.createdAt,
      createdAt: grade.createdAt
    }));

    console.log(`📊 Subject stats: ${subject}, avg=${averageGrade}, grades=${formattedGrades.length}`);

    res.json({
      subject: subject,
      averageGrade: parseFloat(averageGrade),
      finalGrade: finalGrade ? finalGrade.value : null,
      grades: formattedGrades,
      attendanceRate: attendanceRate,
      classRankByGrades: subjectGradeRank,
      classRankByAttendance: subjectAttendanceRank,
      totalClassmates: classmates.length
    });

  } catch (error) {
    console.error('Error fetching subject stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};