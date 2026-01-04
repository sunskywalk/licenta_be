// models/Grade.js
const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
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
  // Учебный год (e.g., 2024 for 2024/2025)
  academicYear: {
    type: Number,
    default: function () {
      const now = new Date();
      // If current month is September or later, use current year, else previous year
      return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    },
  },
  // Числовая оценка
  value: {
    type: Number,
    required: [true, 'Оценка обязательна'],
  },
  // Комментарий к оценке
  comment: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Grade', gradeSchema);