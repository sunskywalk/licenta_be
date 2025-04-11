// controllers/homeworkController.js
const Homework = require('../models/Homework');

exports.createHomework = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав на создание домашек' });
    }
    const { classroom, subject, title, description, dueDate } = req.body;
    const hw = await Homework.create({
      classroom,
      subject,
      teacher: req.user.userId,
      title,
      description,
      dueDate,
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
    const hws = await Homework.find().populate('classroom').populate('teacher', '-password');
    res.json(hws);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getHomeworkById = async (req, res) => {
  try {
    const hw = await Homework.findById(req.params.id)
      .populate('classroom')
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
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const { classroom, subject, title, description, dueDate } = req.body;
    const updated = await Homework.findByIdAndUpdate(
      req.params.id,
      { classroom, subject, title, description, dueDate },
      { new: true }
    )
      .populate('classroom')
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