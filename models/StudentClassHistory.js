const mongoose = require('mongoose');

const studentClassHistorySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
  },
  className: {
    type: String,
    required: true,
  },
  grade: {
    type: Number,
    required: true,
  },
  academicYear: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

studentClassHistorySchema.index({ student: 1, academicYear: 1 });
studentClassHistorySchema.index({ academicYear: 1 });

module.exports = mongoose.model('StudentClassHistory', studentClassHistorySchema);
