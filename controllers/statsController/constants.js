/** Roles used in user counts (must match User.role values). */
const USER_ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin',
};

/** Activity feed item kinds — frontend may rely on these strings. */
const ACTIVITY_TYPES = {
    USER_REGISTERED: 'user_registered',
    NOTIFICATION: 'notification',
    ATTENDANCE: 'attendance',
};

/** How much raw data we pull before mixing into the feed (same slices as original). */
const FETCH_LIMITS = {
    NOTIFICATIONS: 10,
    USERS: 5,
    ATTENDANCE: 5,
    /** Take this many notifs after fetch when building the mix */
    NOTIFICATIONS_IN_FEED: 3,
    ATTENDANCE_IN_FEED: 2,
    FINAL_ACTIVITY_COUNT: 10,
};

/** Ionicons names + hex colors — UI expects these exact strings */
const ACTIVITY_UI = {
    USER_ICON: 'add-circle',
    USER_COLOR: '#00FF00',
    NOTIFICATION_ICON: 'notifications',
    NOTIFICATION_COLOR: '#FF00FF',
    ATTENDANCE_ICON: 'checkmark-circle',
    ATTENDANCE_COLOR: '#FFFF33',
};

const MESSAGES = {
    SYSTEM_STATS_ERROR: 'Error fetching system statistics',
    RECENT_ACTIVITY_ERROR: 'Error fetching recent activities',
    CLASS_STATS_ERROR: 'Error fetching class statistics',
};

/** Attendance status string in DB */
const ATTENDANCE_STATUS = {
    PRESENT: 'present',
};

module.exports = {
    USER_ROLES,
    ACTIVITY_TYPES,
    FETCH_LIMITS,
    ACTIVITY_UI,
    MESSAGES,
    ATTENDANCE_STATUS,
};
