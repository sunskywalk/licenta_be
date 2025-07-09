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
    enum: ['info', 'warning', 'success', 'error', 'support', 'general', 'admin', 'teacher'],
    default: 'info',
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
  // Ответ на уведомление (если это ответ)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
  },
  // Является ли это ответом
  isReply: {
    type: Boolean,
    default: false,
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