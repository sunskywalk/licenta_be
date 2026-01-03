// models/Schedule.js
const mongoose = require('mongoose');

// Helper function to convert time string to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const schedulePeriodSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: [true, 'Время начала обязательно'],
    validate: {
      validator: function (v) {
        // Check format HH:mm (with leading zeros)
        return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'Формат времени должен быть HH:mm (например, 09:00 или 14:30)'
    }
  },
  endTime: {
    type: String,
    required: [true, 'Время окончания обязательно'],
    validate: {
      validator: function (v) {
        // Check format HH:mm
        if (!/^([01]?\d|2[0-3]):([0-5]\d)$/.test(v)) {
          return false;
        }

        // Check that endTime > startTime
        if (this.startTime) {
          const startMinutes = timeToMinutes(this.startTime);
          const endMinutes = timeToMinutes(v);
          return endMinutes > startMinutes;
        }

        return true;
      },
      message: 'Время окончания должно быть позже времени начала и в формате HH:mm'
    }
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