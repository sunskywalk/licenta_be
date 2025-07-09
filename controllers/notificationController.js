// controllers/notificationController.js
const Notification = require('../models/Notification');

exports.createNotification = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }
    
    const { title, message, recipients, type } = req.body;
    
    // Проверяем права на создание уведомлений
    if (req.user.role === 'student') {
      // Студенты могут создавать только уведомления поддержки
      if (type !== 'support') {
        return res.status(403).json({ message: 'Студент может создавать только уведомления поддержки' });
      }
      
      // Для уведомлений поддержки получаем всех админов
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' }).select('_id');
      const adminIds = admins.map(admin => admin._id);
      
      const notif = await Notification.create({ 
        title, 
        message, 
        type: 'support',
        recipients: adminIds,
        senderId: req.user.userId
      });
      
      return res.status(201).json({ message: 'Запрос поддержки отправлен', notification: notif });
    }
    
    // teacher / admin могут создавать любые уведомления
    const notif = await Notification.create({ 
      title, 
      message, 
      type: type || 'general',
      recipients: recipients || [],
      senderId: req.user.userId
    });
    
    res.status(201).json({ message: 'Уведомление создано', notification: notif });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getAllNotifications = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }
    
    if (req.user.role === 'student') {
      const notifs = await Notification.find({
        recipients: { $in: [req.user.userId] },
      })
      .populate('senderId', 'name role')
      .populate('replyTo', 'title')
      .sort({ createdAt: -1 });
      return res.json(notifs);
    } else if (req.user.role === 'admin') {
      // Админы видят все уведомления
      const notifs = await Notification.find()
        .populate('senderId', 'name role')
        .populate('replyTo', 'title')
        .sort({ createdAt: -1 });
      return res.json(notifs);
    } else {
      // Учителя видят только свои уведомления и те, где они получатели
      const notifs = await Notification.find({
        $or: [
          { senderId: req.user.userId },
          { recipients: { $in: [req.user.userId] } }
        ]
      })
      .populate('senderId', 'name role')
      .populate('replyTo', 'title')
      .sort({ createdAt: -1 });
      return res.json(notifs);
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }
    
    const notif = await Notification.findById(req.params.id);
    if (!notif) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    if (req.user.role === 'student') {
      if (!notif.recipients.map(r => r.toString()).includes(req.user.userId)) {
        return res.status(403).json({ message: 'Нет прав' });
      }
    }
    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }
    
    // student может менять isRead = true, teacher/admin могут менять title/message
    const { title, message, recipients, isRead } = req.body;
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { title, message, recipients, isRead },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Уведомление обновлено', notification: updated });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }
    
    // teacher / admin
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Уведомление удалено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// Ответ на уведомление (только для админов)
exports.replyToNotification = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }
    
    // Только админы могут отвечать на уведомления
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только администраторы могут отвечать на уведомления' });
    }
    
    const { title, message } = req.body;
    const originalNotificationId = req.params.id;
    
    // Находим оригинальное уведомление
    const originalNotification = await Notification.findById(originalNotificationId)
      .populate('senderId', 'name role');
      
    if (!originalNotification) {
      return res.status(404).json({ message: 'Оригинальное уведомление не найдено' });
    }
    
    // Создаем ответ, отправляем его автору оригинального уведомления
    const replyNotification = await Notification.create({
      title: `Re: ${originalNotification.title}`,
      message: message,
      type: 'info',
      recipients: [originalNotification.senderId._id],
      senderId: req.user.userId,
      replyTo: originalNotificationId,
      isReply: true
    });
    
    res.status(201).json({ 
      message: 'Ответ отправлен', 
      notification: replyNotification 
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при отправке ответа', error: error.message });
  }
};