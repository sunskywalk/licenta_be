const ROLES = {
    TEACHER: 'teacher',
    ADMIN: 'admin',
    STUDENT: 'student',
};

const MESSAGES = {
    AUTH_REQUIRED: 'Необходима аутентификация',
    NO_CREATE_PERMISSION: 'Нет прав на создание домашек',
    NO_PERMISSION: 'Нет прав',
    NOT_FOUND: 'Не найдено',
    CREATED: 'Домашка создана',
    UPDATED: 'Домашка обновлена',
    DELETED: 'Домашка удалена',
    SERVER_ERROR: 'Ошибка',
};

module.exports = {
    ROLES,
    MESSAGES,
};
