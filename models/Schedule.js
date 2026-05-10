const mongoose = require('mongoose');

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

const schedulePeriodSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: [true, 'Время начала обязательно'],
    validate: {
      validator(v) {
        return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'Формат времени должен быть HH:mm (например, 09:00 или 14:30)',
    },
  },
  endTime: {
    type: String,
    required: [true, 'Время окончания обязательно'],
    validate: {
      validator(v) {
        if (!/^([01]?\d|2[0-3]):([0-5]\d)$/.test(v)) {
          return false;
        }
        if (this.startTime) {
          return timeToMinutes(v) > timeToMinutes(this.startTime);
        }
        return true;
      },
      message: 'Время окончания должно быть позже времени начала и в формате HH:mm',
    },
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

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];

const scheduleSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: [true, 'Класс обязателен'],
  },
  dayOfWeek: {
    type: Number,
    enum: DAYS_OF_WEEK,
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
  // optional migration fields — old rows still work without these
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
  },
  periodNumber: {
    type: Number,
    min: 1,
  },
  periods: [schedulePeriodSchema],
}, {
  timestamps: true,
});

// backwards compat: periodNumber wins, else fall back to semester
scheduleSchema.virtual('effectivePeriodNumber').get(function () {
  return this.periodNumber || this.semester;
});

module.exports = mongoose.model('Schedule', scheduleSchema);
