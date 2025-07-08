// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Имя обязательно'],
  },
  email: {
    type: String,
    required: [true, 'E-mail обязателен'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Пароль обязателен'],
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'student',
  },
  // Код учителя для идентификации
  teacherCode: {
    type: String,
    sparse: true, // Только для учителей
  },
  // Предметы, которые преподает учитель
  subjects: {
    type: [String],
    default: [],
  },
  // Ссылка на класс (для учеников). Учитель может быть в нескольких классах, 
  // поэтому сделаем массив для teacher, но это можно адаптировать под разные сценарии.
  classRooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Хэширование пароля перед сохранением
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Проверка пароля
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);