const mongoose = require('mongoose');

const NOTIFICATION_TYPES = ['info', 'warning', 'success', 'error', 'support', 'general', 'admin', 'teacher'];

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Заголовок уведомления обязателен'],
  },
  message: {
    type: String,
    required: [true, 'Текст уведомления обязателен'],
  },
  type: {
    type: String,
    enum: NOTIFICATION_TYPES,
    default: 'info',
  },
  recipients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
  },
  isReply: {
    type: Boolean,
    default: false,
  },
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
