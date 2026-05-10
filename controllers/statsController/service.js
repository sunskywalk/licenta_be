const repository = require('./repository');
const { getTimeAgo } = require('./helpers');
const {
    USER_ROLES,
    ACTIVITY_TYPES,
    FETCH_LIMITS,
    ACTIVITY_UI,
} = require('./constants');

async function buildSystemStats() {
    const [
        totalUsers,
        studentCount,
        teacherCount,
        adminCount,
        classCount,
        notificationCount,
        attendanceData,
    ] = await Promise.all([
        repository.countTotalUsers(),
        repository.countUsersWithRole(USER_ROLES.STUDENT),
        repository.countUsersWithRole(USER_ROLES.TEACHER),
        repository.countUsersWithRole(USER_ROLES.ADMIN),
        repository.countClassrooms(),
        repository.countNotifications(),
        repository.aggregateAttendancePresentTotals(),
    ]);

    let averageAttendance = 0;
    if (attendanceData.length > 0 && attendanceData[0].totalRecords > 0) {
        averageAttendance =
            (attendanceData[0].presentRecords / attendanceData[0].totalRecords) * 100;
        averageAttendance = Math.round(averageAttendance * 10) / 10;
    }

    return {
        totalUsers,
        students: studentCount,
        teachers: teacherCount,
        admins: adminCount,
        classes: classCount,
        notifications: notificationCount,
        averageAttendance,
    };
}

async function buildRecentActivityList() {
    const [recentNotifications, recentUsers, recentAttendance] = await Promise.all([
        repository.findRecentNotificationsDesc(),
        repository.findRecentUsersDesc(),
        repository.findRecentAttendanceDesc(),
    ]);

    const activities = [];

    recentUsers.forEach((user) => {
        activities.push({
            type: ACTIVITY_TYPES.USER_REGISTERED,
            icon: ACTIVITY_UI.USER_ICON,
            color: ACTIVITY_UI.USER_COLOR,
            text: `New ${user.role} registered: ${user.name}`,
            timestamp: user.createdAt,
            time: getTimeAgo(user.createdAt),
        });
    });

    recentNotifications.slice(0, FETCH_LIMITS.NOTIFICATIONS_IN_FEED).forEach((notification) => {
        activities.push({
            type: ACTIVITY_TYPES.NOTIFICATION,
            icon: ACTIVITY_UI.NOTIFICATION_ICON,
            color: ACTIVITY_UI.NOTIFICATION_COLOR,
            text: notification.title,
            timestamp: notification.createdAt,
            time: getTimeAgo(notification.createdAt),
        });
    });

    recentAttendance.slice(0, FETCH_LIMITS.ATTENDANCE_IN_FEED).forEach((attendance) => {
        activities.push({
            type: ACTIVITY_TYPES.ATTENDANCE,
            icon: ACTIVITY_UI.ATTENDANCE_ICON,
            color: ACTIVITY_UI.ATTENDANCE_COLOR,
            text: `Attendance recorded for ${attendance.student?.name || 'Student'}`,
            timestamp: attendance.date,
            time: getTimeAgo(attendance.date),
        });
    });

    return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, FETCH_LIMITS.FINAL_ACTIVITY_COUNT);
}

async function getClassStatistics() {
    return repository.aggregateClassStatistics();
}

module.exports = {
    buildSystemStats,
    buildRecentActivityList,
    getClassStatistics,
};
