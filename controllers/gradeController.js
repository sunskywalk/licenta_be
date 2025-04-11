// controllers/gradeController.js
const Grade = require('../models/Grade');
const User = require('../models/User');

// Добавление оценки (только teacher/admin, но логика обычно для teacher)
exports.createGrade = async (req, res) => {
  try {
    // role teacher или admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только учитель или админ может добавлять оценки' });
    }

    const { student, subject, type, semester, value } = req.body;
    const newGrade = await Grade.create({
      student,
      subject,
      type,
      semester,
      value,
    });

    res.status(201).json({
      message: 'Оценка создана',
      grade: newGrade,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании оценки', error: error.message });
  }
};

// Получить все оценки
exports.getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.find().populate('student', '-password');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении оценок', error: error.message });
  }
};

// Получить оценку по ID
exports.getGradeById = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id).populate('student', '-password');
    if (!grade) {
      return res.status(404).json({ message: 'Оценка не найдена' });
    }
    res.json(grade);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении оценки', error: error.message });
  }
};

// Обновить оценку
exports.updateGrade = async (req, res) => {
  try {
    // teacher или admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав для обновления оценки' });
    }

    const { student, subject, type, semester, value } = req.body;

    const updated = await Grade.findByIdAndUpdate(
      req.params.id,
      { student, subject, type, semester, value },
      { new: true }
    ).populate('student', '-password');

    if (!updated) {
      return res.status(404).json({ message: 'Оценка не найдена' });
    }
    res.json({
      message: 'Оценка обновлена',
      grade: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении оценки', error: error.message });
  }
};

// Удалить оценку
exports.deleteGrade = async (req, res) => {
  try {
    // teacher или admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав для удаления оценки' });
    }

    const deleted = await Grade.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Оценка не найдена' });
    }
    res.json({ message: 'Оценка удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении оценки', error: error.message });
  }
};

// Получить среднюю оценку ученика по предмету / семестру / в целом
exports.getStudentAverage = async (req, res) => {
  try {
    // Любой авторизованный, но, как правило, 
    // student может смотреть свои оценки, teacher/admin — других
    const { studentId } = req.params;
    const { subject, semester } = req.query;

    // Ограничим доступ: если student, то только свои оценки
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({ message: 'Нет доступа к чужим оценкам' });
    }

    let filter = { student: studentId };
    if (subject) {
      filter.subject = subject;
    }
    if (semester) {
      filter.semester = Number(semester); // 1 или 2
    }

    const grades = await Grade.find(filter);
    if (grades.length === 0) {
      return res.json({ average: 0, count: 0 });
    }

    const sum = grades.reduce((acc, g) => acc + g.value, 0);
    const avg = sum / grades.length;

    res.json({
      average: avg.toFixed(2),
      count: grades.length,
      details: grades,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при вычислении средней', error: error.message });
  }
};

// Получить финальную (итоговую) оценку (среднее из двух семестров) по предмету
exports.getFinalAverage = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject } = req.query;

    // Если student, только свои
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({ message: 'Нет доступа' });
    }

    let filter = { student: studentId };
    if (subject) {
      filter.subject = subject;
    }

    const allGrades = await Grade.find(filter);

    // Разбиваем по семестрам
    const sem1Grades = allGrades.filter(g => g.semester === 1);
    const sem2Grades = allGrades.filter(g => g.semester === 2);

    const avgSem1 = sem1Grades.length
      ? sem1Grades.reduce((acc, g) => acc + g.value, 0) / sem1Grades.length
      : 0;
    const avgSem2 = sem2Grades.length
      ? sem2Grades.reduce((acc, g) => acc + g.value, 0) / sem2Grades.length
      : 0;

    // Итоговая: среднее из avgSem1 и avgSem2
    const finalAverage = (avgSem1 + avgSem2) / 2;

    res.json({
      averageSemester1: avgSem1.toFixed(2),
      averageSemester2: avgSem2.toFixed(2),
      finalAverage: finalAverage.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при вычислении финальной оценки', error: error.message });
  }
};