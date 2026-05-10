const mongoose = require('mongoose');

const GRADE_TYPES = ['homework', 'lesson', 'test', 'final'];
const SEMESTERS = [1, 2];

function defaultAcademicYear() {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

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
  type: {
    type: String,
    enum: GRADE_TYPES,
    default: 'lesson',
  },
  semester: {
    type: Number,
    enum: SEMESTERS,
    required: [true, 'Нужно указать семестр (1 или 2)'],
  },
  academicYear: {
    type: Number,
    default: defaultAcademicYear,
  },
  value: {
    type: Number,
    required: [true, 'Оценка обязательна'],
  },
  comment: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Grade', gradeSchema);
