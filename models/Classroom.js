// models/Classroom.js
const mongoose = require('mongoose');

// Пример: "5A", "11B" и т.д.
const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название класса (например, 5A) обязательно'],
    unique: true,
  },
  // Учителя, которые могут вести занятия в этом классе
  teachers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  // Ученики, которые принадлежат этому классу
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  // Классный руководитель (может видеть всю статистику класса)
  homeroomTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Classroom', classroomSchema);