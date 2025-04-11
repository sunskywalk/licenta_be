// controllers/homeworkController.js
const Homework = require('../models/Homework');

// Создать задание (teacher/admin)
exports.createHomework = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только учитель или админ может создавать домашнее задание' });
    }

    const { classroom, subject, title, description, dueDate } = req.body;
    const homework = await Homework.create({
      classroom,
      subject,
      teacher: req.user.userId, // текущий учитель
      title,
      description,
      dueDate,
    });

    res.status(201).json({
      message: 'Домашнее задание создано',
      homework,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании домашнего задания', error: error.message });
  }
};

// Получить все задания
exports.getAllHomeworks = async (req, res) => {
  try {
    // Учитель/Admin видят все, студент — может фильтровать только по своим классам (необязательно)
    const homeworks = await Homework.find()
      .populate('classroom')
      .populate('teacher', '-password');
    res.json(homeworks);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении домашек', error: error.message });
  }
};

// Получить по ID
exports.getHomeworkById = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('classroom')
      .populate('teacher', '-password');
    if (!homework) {
      return res.status(404).json({ message: 'Домашнее задание не найдено' });
    }
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении домашки', error: error.message });
  }
};

// Обновить домашнее задание
exports.updateHomework = async (req, res) => {
  try {
    // teacher / admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав для обновления' });
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
      return res.status(404).json({ message: 'Домашнее задание не найдено' });
    }

    res.json({
      message: 'Домашнее задание обновлено',
      homework: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении домашнего задания', error: error.message });
  }
};

// Удалить домашнее задание
exports.deleteHomework = async (req, res) => {
  try {
    // teacher / admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав для удаления' });
    }

    const deleted = await Homework.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Домашнее задание не найдено' });
    }

    res.json({
      message: 'Домашнее задание удалено',
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении домашки', error: error.message });
  }
};