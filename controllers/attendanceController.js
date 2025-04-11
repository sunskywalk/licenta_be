// controllers/attendanceController.js
const Attendance = require('../models/Attendance');

exports.createAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав отмечать посещаемость' });
    }
    const { student, subject, status } = req.body;
    const record = await Attendance.create({ student, subject, status });
    res.status(201).json({ message: 'Посещаемость отмечена', attendance: record });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    // если student - только свои записи
    if (req.user.role === 'student') {
      const records = await Attendance.find({ student: req.user.userId })
        .populate('student', '-password');
      return res.json(records);
    } else {
      // teacher/admin - все
      const records = await Attendance.find().populate('student', '-password');
      return res.json(records);
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id).populate('student', '-password');
    if (!record) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    if (req.user.role === 'student' && record.student._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Нет прав' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const { student, subject, status } = req.body;
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      { student, subject, status },
      { new: true }
    ).populate('student', '-password');
    if (!updated) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Посещаемость обновлена', attendance: updated });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Запись удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};