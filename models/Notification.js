// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Заголовок уведомления обязателен'],
  },
  message: {
    type: String,
    required: [true, 'Текст уведомления обязателен'],
  },
  // Тип уведомления
  type: {
    type: String,
    enum: ['general', 'support', 'admin', 'teacher'],
    default: 'general',
  },
  // Можно отправлять уведомления конкретному пользователю (либо массиву)
  recipients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  // Отправитель уведомления
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Признак, что уведомление прочитано
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);