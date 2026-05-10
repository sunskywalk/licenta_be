const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ROLES = ['admin', 'teacher', 'student'];

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
    enum: ROLES,
    default: 'student',
  },
  teacherCode: {
    type: String,
    sparse: true,
  },
  subjects: {
    type: [String],
    default: [],
  },
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

// lowercase email + hash password when it is changed
userSchema.pre('save', async function (next) {
  try {
    if (this.isModified('email')) {
      this.email = this.email.toLowerCase();
    }
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

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
