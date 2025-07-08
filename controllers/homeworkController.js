// controllers/homeworkController.js
const Homework = require('../models/Homework');

exports.createHomework = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }
    
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав на создание домашек' });
    }
    const { classId, subject, title, description, dueDate, assignedTo } = req.body;
    const hw = await Homework.create({
      classId,
      subject,
      teacher: req.user.userId,
      title,
      description,
      dueDate,
      assignedTo: assignedTo || [],
    });
    res.status(201).json({ message: 'Домашка создана', homework: hw });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getAllHomeworks = async (req, res) => {
  try {
    // teacher/admin видят все, студент может фильтровать
    // Для простоты - все
    const hws = await Homework.find().populate('classId').populate('teacher', '-password');
    res.json(hws);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getHomeworkById = async (req, res) => {
  try {
    const hw = await Homework.findById(req.params.id)
      .populate('classId')
      .populate('teacher', '-password');
    if (!hw) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json(hw);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.updateHomework = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }
    
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const { classId, subject, title, description, dueDate, assignedTo } = req.body;
    const updated = await Homework.findByIdAndUpdate(
      req.params.id,
      { classId, subject, title, description, dueDate, assignedTo },
      { new: true }
    )
      .populate('classId')
      .populate('teacher', '-password');
    if (!updated) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Домашка обновлена', homework: updated });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.deleteHomework = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }
    
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const deleted = await Homework.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Домашка удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Получение домашних заданий по классу
// ============================
exports.getHomeworkByClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    console.log('[getHomeworkByClassroom] classroomId:', classroomId, 'user:', req.user.userId, 'role:', req.user.role);
    
    const homeworks = await Homework.find({ classId: classroomId })
      .populate('classId')
      .populate('teacher', '-password')
      .sort({ dueDate: 1 });
    
    console.log('[getHomeworkByClassroom] found homeworks:', homeworks.length);
    res.json(homeworks);
  } catch (error) {
    console.error('Error in getHomeworkByClassroom:', error);
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Получение домашних заданий студента
// ============================
exports.getHomeworkByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('[getHomeworkByStudent] studentId:', studentId, 'user:', req.user.userId, 'role:', req.user.role);
    
    // Студент может смотреть только свои домашние задания
    if (req.user.role === 'student' && String(req.user.userId) !== String(studentId)) {
      return res.status(403).json({ message: 'Нет прав' });
    }
    
    // Найти все домашние задания, где студент в assignedTo или класс студента
    const homeworks = await Homework.find({
      $or: [
        { assignedTo: studentId },
        // Можно добавить поиск по классу студента, если нужно
      ]
    })
      .populate('classId')
      .populate('teacher', '-password')
      .sort({ dueDate: 1 });
    
    console.log('[getHomeworkByStudent] found homeworks:', homeworks.length);
    res.json(homeworks);
  } catch (error) {
    console.error('Error in getHomeworkByStudent:', error);
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Получение домашних заданий учителя
// ============================
exports.getHomeworkByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log('[getHomeworkByTeacher] teacherId:', teacherId, 'user:', req.user.userId, 'role:', req.user.role);
    
    // Учитель может смотреть только свои домашние задания
    if (req.user.role === 'teacher' && String(req.user.userId) !== String(teacherId)) {
      return res.status(403).json({ message: 'Нет прав' });
    }
    
    const homeworks = await Homework.find({ teacher: teacherId })
      .populate('classId')
      .populate('teacher', '-password')
      .sort({ dueDate: 1 });
    
    console.log('[getHomeworkByTeacher] found homeworks:', homeworks.length);
    res.json(homeworks);
  } catch (error) {
    console.error('Error in getHomeworkByTeacher:', error);
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};