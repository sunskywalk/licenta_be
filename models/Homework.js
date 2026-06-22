const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: [true, 'Нужно указать класс (Classroom)'],
  },
  subject: {
    type: String,
    required: [true, 'Название предмета обязательно'],
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Учитель обязателен'],
  },
  title: {
    type: String,
    required: [true, 'Название домашнего задания обязательно'],
  },
  description: {
    type: String,
  },
  dueDate: {
    type: Date,
    required: [true, 'Нужно указать дату сдачи'],
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  attachments: [{
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    url: { type: String, required: true },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Homework', homeworkSchema);
