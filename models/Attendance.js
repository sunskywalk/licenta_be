const mongoose = require('mongoose');

const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'];

const attendanceSchema = new mongoose.Schema({
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
    required: [true, 'Название предмета обязательно'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ATTENDANCE_STATUSES,
    default: 'present',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Attendance', attendanceSchema);
