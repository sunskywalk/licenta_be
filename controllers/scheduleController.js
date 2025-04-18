// controllers/scheduleController.js
const Schedule = require('../models/Schedule');

exports.createSchedule = async (req, res) => {
  try {
    // Только admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const { classroom, subject, teacher, dayOfWeek, startTime, endTime } = req.body;
    const schedule = await Schedule.create({
      classroom,
      subject,
      teacher,
      dayOfWeek,
      startTime,
      endTime,
    });
    res.status(201).json({ message: 'Расписание создано', schedule });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getAllSchedules = async (req, res) => {
  try {
    // Любой авторизованный
    const schedules = await Schedule.find()
      .populate('classroom')
      .populate('teacher', '-password');
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('classroom')
      .populate('teacher', '-password');
    if (!schedule) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const { classroom, subject, teacher, dayOfWeek, startTime, endTime } = req.body;
    const updated = await Schedule.findByIdAndUpdate(
      req.params.id,
      { classroom, subject, teacher, dayOfWeek, startTime, endTime },
      { new: true }
    ).populate('classroom').populate('teacher', '-password');
    if (!updated) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Расписание обновлено', schedule: updated });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Расписание удалено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};