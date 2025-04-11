// controllers/notificationController.js
const Notification = require('../models/Notification');

// Создать уведомление (admin / teacher?)
exports.createNotification = async (req, res) => {
  try {
    // Допустим, создавать может и teacher, и admin
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Студент не может создавать уведомления' });
    }

    const { title, message, recipients } = req.body;
    const notification = await Notification.create({
      title,
      message,
      recipients: recipients || [],
    });

    res.status(201).json({
      message: 'Уведомление создано',
      notification,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании уведомления', error: error.message });
  }
};

// Получить все уведомления (admin/teacher видят все, student — только свои)
exports.getAllNotifications = async (req, res) => {
  try {
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
    res.status(500).json({ message: 'Ошибка при получении уведомлений', error: error.message });
  }
};

// Получить уведомление по ID
exports.getNotificationById = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    // Если student, проверим, что он есть в recipients
    if (req.user.role === 'student') {
      if (!notif.recipients.map(r => r.toString()).includes(req.user.userId)) {
        return res.status(403).json({ message: 'Нет доступа к этому уведомлению' });
      }
    }

    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении уведомления', error: error.message });
  }
};

// Обновить (пометить как прочитанное и т.п.)
exports.updateNotification = async (req, res) => {
  try {
    // Логику можно варьировать: студент может пометить уведомление как прочитанное
    // teacher/admin могут обновлять сообщение
    const { title, message, recipients, isRead } = req.body;

    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { title, message, recipients, isRead },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    res.json({
      message: 'Уведомление обновлено',
      notification: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении уведомления', error: error.message });
  }
};

// Удалить
exports.deleteNotification = async (req, res) => {
  try {
    // admin / teacher
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Студент не может удалять уведомления' });
    }

    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    res.json({ message: 'Уведомление удалено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении уведомления', error: error.message });
  }
};