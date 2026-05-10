const repository = require('./repository');
const { NOTIFICATION_TYPES, ROLES } = require('./constants');

async function createSupportNotification({ title, message, senderId }) {
    const adminIds = await repository.findAdminIds();
    return repository.createNotification({
        title,
        message,
        type: NOTIFICATION_TYPES.SUPPORT,
        recipients: adminIds,
        senderId,
    });
}

async function createGeneralNotification({ title, message, type, recipients, senderId }) {
    return repository.createNotification({
        title,
        message,
        type: type || NOTIFICATION_TYPES.GENERAL,
        recipients: recipients || [],
        senderId,
    });
}

async function listNotificationsForRole(role, userId) {
    if (role === ROLES.STUDENT) {
        return repository.listForStudent(userId);
    }
    if (role === ROLES.ADMIN) {
        return repository.listForAdmin();
    }
    return repository.listForTeacher(userId);
}

async function getNotificationById(id) {
    return repository.findById(id);
}

async function updateNotification(id, body) {
    const { title, message, recipients, isRead } = body;
    return repository.updateById(id, { title, message, recipients, isRead });
}

async function deleteNotification(id) {
    return repository.deleteById(id);
}

async function createReplyFromAdmin({ originalId, message, adminUserId }) {
    const original = await repository.findByIdWithSenderForReply(originalId);
    if (!original) {
        return { ok: false, reason: 'not_found' };
    }
    const reply = await repository.createNotification({
        title: `Re: ${original.title}`,
        message,
        type: NOTIFICATION_TYPES.INFO,
        recipients: [original.senderId._id],
        senderId: adminUserId,
        replyTo: originalId,
        isReply: true,
    });
    return { ok: true, notification: reply };
}

module.exports = {
    createSupportNotification,
    createGeneralNotification,
    listNotificationsForRole,
    getNotificationById,
    updateNotification,
    deleteNotification,
    createReplyFromAdmin,
};
