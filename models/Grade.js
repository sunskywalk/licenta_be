// models/Grade.js
const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  // Тип оценки: домашка, урок, контрольная, итоговая
  type: {
    type: String,
    enum: ['homework', 'lesson', 'test', 'final'],
    default: 'lesson',
  },
  // Семестр
  semester: {
    type: Number,
    enum: [1, 2],
    required: [true, 'Нужно указать семестр (1 или 2)'],
  },
  // Числовая оценка
  value: {
    type: Number,
    required: [true, 'Оценка обязательна'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Grade', gradeSchema);