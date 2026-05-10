const service = require('./service');
const { MESSAGES, ROLES } = require('./constants');
const { studentCreatingNonSupport } = require('./validators');
const { recipientListIncludesUser } = require('./helpers');

async function createNotification(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
        }

        const { title, message, recipients, type } = req.body;

        if (req.user.role === ROLES.STUDENT) {
            // only support tickets, anything else 403
            if (studentCreatingNonSupport(req.user.role, type)) {
                return res.status(403).json({ message: MESSAGES.STUDENT_ONLY_SUPPORT });
            }

            const notif = await service.createSupportNotification({
                title,
                message,
                senderId: req.user.userId,
            });

            return res.status(201).json({
                message: MESSAGES.SUPPORT_SENT,
                notification: notif,
            });
        }

        const notif = await service.createGeneralNotification({
            title,
            message,
            type,
            recipients,
            senderId: req.user.userId,
        });

        res.status(201).json({ message: MESSAGES.CREATED, notification: notif });
    } catch (error) {
        res.status(500).json({ message: MESSAGES.ERROR, error: error.message });
    }
}

async function getAllNotifications(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
        }

        const notifs = await service.listNotificationsForRole(req.user.role, req.user.userId);
        return res.json(notifs);
    } catch (error) {
        res.status(500).json({ message: MESSAGES.ERROR, error: error.message });
    }
}

async function getNotificationById(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
        }

        const notif = await service.getNotificationById(req.params.id);
        if (!notif) {
            return res.status(404).json({ message: MESSAGES.NOT_FOUND });
        }
        if (req.user.role === ROLES.STUDENT) {
            if (!recipientListIncludesUser(notif, req.user.userId)) {
                return res.status(403).json({ message: MESSAGES.NO_ACCESS });
            }
        }
        res.json(notif);
    } catch (error) {
        res.status(500).json({ message: MESSAGES.ERROR, error: error.message });
    }
}

async function updateNotification(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
        }

        const updated = await service.updateNotification(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ message: MESSAGES.NOT_FOUND });
        }
        res.json({ message: MESSAGES.UPDATED, notification: updated });
    } catch (error) {
        res.status(500).json({ message: MESSAGES.ERROR, error: error.message });
    }
}

async function deleteNotification(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
        }

        if (req.user.role === ROLES.STUDENT) {
            return res.status(403).json({ message: MESSAGES.NO_ACCESS });
        }
        const deleted = await service.deleteNotification(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: MESSAGES.NOT_FOUND });
        }
        res.json({ message: MESSAGES.DELETED });
    } catch (error) {
        res.status(500).json({ message: MESSAGES.ERROR, error: error.message });
    }
}

async function replyToNotification(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
        }

        if (req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: MESSAGES.ADMIN_REPLY_ONLY });
        }

        const { message } = req.body;
        const result = await service.createReplyFromAdmin({
            originalId: req.params.id,
            message,
            adminUserId: req.user.userId,
        });

        if (!result.ok) {
            return res.status(404).json({ message: MESSAGES.ORIGINAL_NOT_FOUND });
        }

        res.status(201).json({
            message: MESSAGES.REPLY_SENT,
            notification: result.notification,
        });
    } catch (error) {
        res.status(500).json({ message: MESSAGES.REPLY_ERROR, error: error.message });
    }
}

module.exports = {
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
    replyToNotification,
};
