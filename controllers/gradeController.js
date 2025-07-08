// controllers/gradeController.js
const Grade = require('../models/Grade');

exports.createGrade = async (req, res) => {
  try {
    // teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав добавлять оценки' });
    }
    const { student, subject, type, semester, value, classId, comment } = req.body;
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
    
    const grades = await Grade.find({ student: studentId })
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