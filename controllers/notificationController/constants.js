// Russian API strings — do not "improve" wording, clients rely on exact text
module.exports = {
    ROLES: {
        STUDENT: 'student',
        ADMIN: 'admin',
        TEACHER: 'teacher',
    },
    NOTIFICATION_TYPES: {
        SUPPORT: 'support',
        GENERAL: 'general',
        INFO: 'info',
    },
    POPULATE: {
        SENDER: 'senderId',
        SENDER_FIELDS: 'name role',
        REPLY_TO: 'replyTo',
        REPLY_TO_FIELDS: 'title',
    },
    MESSAGES: {
        AUTH_REQUIRED: 'Необходима аутентификация',
        STUDENT_ONLY_SUPPORT: 'Студент может создавать только уведомления поддержки',
        SUPPORT_SENT: 'Запрос поддержки отправлен',
        CREATED: 'Уведомление создано',
        ERROR: 'Ошибка',
        NOT_FOUND: 'Не найдено',
        NO_ACCESS: 'Нет прав',
        UPDATED: 'Уведомление обновлено',
        DELETED: 'Уведомление удалено',
        ADMIN_REPLY_ONLY: 'Только администраторы могут отвечать на уведомления',
        ORIGINAL_NOT_FOUND: 'Оригинальное уведомление не найдено',
        REPLY_SENT: 'Ответ отправлен',
        REPLY_ERROR: 'Ошибка при отправке ответа',
    },
};
