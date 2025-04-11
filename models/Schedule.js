// models/Schedule.js
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Название предмета обязательно'],
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Ссылка на модель User, у которой role = 'teacher'
    required: [true, 'Учитель обязателен'],
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  startTime: {
    type: String,
    required: [true, 'Время начала обязательно'],
  },
  endTime: {
    type: String,
    required: [true, 'Время окончания обязательно'],
  },
});

module.exports = mongoose.model('Schedule', scheduleSchema);