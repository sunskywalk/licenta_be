// controllers/scheduleController.js
const Schedule = require('../models/Schedule');
const Classroom = require('../models/Classroom');

exports.createSchedule = async (req, res) => {
  try {
    const { classId, dayOfWeek, week, semester, year, periods } = req.body;
    const schedule = await Schedule.create({
      classId,
      dayOfWeek,
      week,
      semester,
      year,
      periods,
    });
    
    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('classId')
      .populate('periods.teacherId', '-password');
      
    res.status(201).json({ message: 'Расписание создано', schedule: populatedSchedule });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate({
        path: 'classId',
        populate: {
          path: 'students teachers',
          select: 'name email role'
        }
      })
      .populate('periods.teacherId', 'name email');
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('classId')
      .populate('periods.teacherId', '-password');
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
    const { classId, dayOfWeek, week, semester, year, periods } = req.body;
    const updated = await Schedule.findByIdAndUpdate(
      req.params.id,
      { classId, dayOfWeek, week, semester, year, periods },
      { new: true }
    ).populate('classId').populate('periods.teacherId', '-password');
    
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
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Расписание удалено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// @desc    Get all schedules for a specific teacher
// @route   GET /api/schedules/teacher/:teacherId
// @access  Private (Teacher, Admin)
exports.getTeacherSchedule = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Учитель может видеть только свое расписание
    if (req.user.role === 'teacher' && req.user.userId !== teacherId) {
      return res.status(403).json({ message: 'Нет прав' });
    }
    
    // Find classes where the teacher is assigned
    const teacherClasses = await Classroom.find({ teachers: teacherId }).select('_id');
    const classIds = teacherClasses.map(c => c._id);

    // Find schedules for those classes
    const schedules = await Schedule.find({ classId: { $in: classIds } })
      .populate({
        path: 'classId',
        populate: {
          path: 'students teachers',
          select: 'name email role'
        }
      })
      .populate('periods.teacherId', 'name email');

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all schedules for a specific class
// @route   GET /api/schedules/class/:classId
// @access  Private
exports.getScheduleByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const schedules = await Schedule.find({ classId })
      .populate({
        path: 'classId',
        populate: {
          path: 'students teachers',
          select: 'name email role'
        }
      })
      .populate('periods.teacherId', 'name email');

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching class schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all schedules for a specific day of week
// @route   GET /api/schedules/day/:dayOfWeek
// @access  Private
exports.getScheduleByDay = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    
    const schedules = await Schedule.find({ dayOfWeek: parseInt(dayOfWeek) })
      .populate({
        path: 'classId',
        populate: {
          path: 'students teachers',
          select: 'name email role'
        }
      })
      .populate('periods.teacherId', 'name email');

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching day schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};