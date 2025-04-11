// controllers/gradeController.js
const Grade = require('../models/Grade');

exports.createGrade = async (req, res) => {
  try {
    // teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав добавлять оценки' });
    }
    const { student, subject, type, semester, value } = req.body;
    const newGrade = await Grade.create({
      student,
      subject,
      type,
      semester,
      value,
    });
    res.status(201).json({ message: 'Оценка создана', grade: newGrade });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getAllGrades = async (req, res) => {
  try {
    // Любой авторизованный, но student увидит только свои? Можно сделать фильтр
    // Для простоты — возвращаем все
    const grades = await Grade.find().populate('student', '-password');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getGradeById = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id).populate('student', '-password');
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
    const { student, subject, type, semester, value } = req.body;
    const updated = await Grade.findByIdAndUpdate(
      req.params.id,
      { student, subject, type, semester, value },
      { new: true }
    ).populate('student', '-password');
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
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const { subject, semester } = req.query;
    let filter = { student: studentId };
    if (subject) filter.subject = subject;
    if (semester) filter.semester = Number(semester);

    const grades = await Grade.find(filter);
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
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const { subject } = req.query;
    let filter = { student: studentId };
    if (subject) filter.subject = subject;

    const allGrades = await Grade.find(filter);
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