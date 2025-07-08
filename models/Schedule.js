// models/Schedule.js
const mongoose = require('mongoose');

const schedulePeriodSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: [true, 'Время начала обязательно'],
  },
  endTime: {
    type: String,
    required: [true, 'Время окончания обязательно'],
  },
  subject: {
    type: String,
    required: [true, 'Название предмета обязательно'],
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Учитель обязателен'],
  },
  room: {
    type: String,
    default: '',
  },
});

const scheduleSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: [true, 'Класс обязателен'],
  },
  dayOfWeek: {
    type: Number,
    enum: [0, 1, 2, 3, 4, 5, 6], // 0 = Sunday, 1 = Monday, etc.
    required: true,
  },
  week: {
    type: Number,
    required: [true, 'Номер недели обязателен'],
    min: 1,
    max: 52,
  },
  semester: {
    type: Number,
    enum: [1, 2],
    required: [true, 'Семестр обязателен'],
  },
  year: {
    type: Number,
    required: [true, 'Год обязателен'],
  },
  periods: [schedulePeriodSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Schedule', scheduleSchema);