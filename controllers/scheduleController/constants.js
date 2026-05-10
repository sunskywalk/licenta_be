// API strings kept verbatim — clients may rely on exact wording
module.exports = {
    ROLES: {
        TEACHER: 'teacher',
        ADMIN: 'admin',
        STUDENT: 'student',
    },
    EVENT_TYPES: {
        VACATION: 'vacation',
        HOLIDAY: 'holiday',
        SHORTENED_DAY: 'shortened_day',
        CLASS_EXCEPTION: 'class_exception',
        NORMAL: 'normal',
    },
    LESSON_STATUS: {
        NORMAL: 'normal',
        CANCELLED: 'cancelled',
    },
    MESSAGES: {
        CONFLICT_CREATE: 'Конфликт расписания! Расписание не может быть создано.',
        CONFLICT_UPDATE: 'Конфликт расписания при обновлении!',
        CREATED: 'Расписание создано',
        UPDATED: 'Расписание обновлено',
        DELETED: 'Расписание удалено',
        NOT_FOUND: 'Не найдено',
        ERROR: 'Ошибка',
        NO_ACCESS: 'Нет прав',
        SERVER_ERROR: 'Server error',
        USER_NOT_FOUND: 'User not found',
        STUDENT_NOT_FOUND: 'Student not found',
        DAY_FETCH_ERROR: 'Ошибка при получении дат недели',
        SCHEDULE_FETCH_ERROR: 'Ошибка при получении расписания',
        INVALID_SEMESTER_WEEK: 'Invalid semester or week.',
    },
    POPULATE: {
        CLASS_DEEP: {
            path: 'classId',
            populate: {
                path: 'students teachers',
                select: 'name email role',
            },
        },
        TEACHER_PUBLIC: 'periods.teacherId',
        TEACHER_PUBLIC_FIELDS: 'name email',
        TEACHER_NO_PASSWORD: '-password',
        CLASS_NAME_ONLY: 'classId',
        CLASS_NAME_FIELDS: 'name',
    },
};
