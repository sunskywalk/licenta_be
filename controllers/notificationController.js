// controllers/notificationController.js
const Notification = require('../models/Notification');

exports.createNotification = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }
    
    // teacher / admin
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Студент не может создавать уведомления' });
    }
    const { title, message, recipients } = req.body;
    const notif = await Notification.create({ title, message, recipients: recipients || [] });
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
      }).sort({ createdAt: -1 });
      return res.json(notifs);
    } else {
      // teacher / admin видят все
      const notifs = await Notification.find().sort({ createdAt: -1 });
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