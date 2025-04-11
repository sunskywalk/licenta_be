// controllers/attendanceController.js
const Attendance = require('../models/Attendance');

exports.createAttendance = async (req, res) => {
  try {
    // Обычно teacher / admin отмечает посещаемость
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав для отметки посещаемости' });
    }

    const { student, subject, status } = req.body;
    const attendance = await Attendance.create({ student, subject, status });
    res.status(201).json({
      message: 'Запись о посещаемости создана',
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании записи посещаемости', error: error.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    // Любой авторизованный, но student видит только свои
    if (req.user.role === 'student') {
      const records = await Attendance.find({ student: req.user.userId }).populate('student', '-password');
      return res.json(records);
    } else {
      const records = await Attendance.find().populate('student', '-password');
      return res.json(records);
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении записей посещаемости', error: error.message });
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate('student', '-password');
    if (!attendance) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    // Если студент, то только свои записи
    if (req.user.role === 'student' && attendance.student._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Нет доступа' });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении записи посещаемости', error: error.message });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    // teacher / admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав для обновления посещаемости' });
    }

    const { student, subject, status } = req.body;
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      { student, subject, status },
      { new: true }
    ).populate('student', '-password');

    if (!updated) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    res.json({
      message: 'Запись о посещаемости обновлена',
      attendance: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении записи посещаемости', error: error.message });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    // teacher / admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав для удаления записей посещаемости' });
    }

    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }
    res.json({ message: 'Запись о посещаемости удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении записи посещаемости', error: error.message });
  }
};