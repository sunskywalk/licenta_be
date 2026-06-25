const repository = require('./repository');
const { getTimeAgo } = require('./helpers');
const {
    USER_ROLES,
    ACTIVITY_TYPES,
    FETCH_LIMITS,
    ACTIVITY_UI,
} = require('./constants');

const ATTENDANCE_TREND_DAYS = 7;

async function buildSystemStats() {
    const [
        totalUsers,
        studentCount,
        teacherCount,
        adminCount,
        classCount,
        notificationCount,
        totalGrades,
        attendanceData,
        attendanceTrendRaw,
    ] = await Promise.all([
        repository.countTotalUsers(),
        repository.countUsersWithRole(USER_ROLES.STUDENT),
        repository.countUsersWithRole(USER_ROLES.TEACHER),
        repository.countUsersWithRole(USER_ROLES.ADMIN),
        repository.countClassrooms(),
        repository.countNotifications(),
        repository.countGrades(),
        repository.aggregateAttendancePresentTotals(),
        repository.aggregateAttendanceTrend(ATTENDANCE_TREND_DAYS),
    ]);

    let averageAttendance = 0;
    if (attendanceData.length > 0 && attendanceData[0].totalRecords > 0) {
        averageAttendance =
            (attendanceData[0].presentRecords / attendanceData[0].totalRecords) * 100;
        averageAttendance = Math.round(averageAttendance * 10) / 10;
    }

    const attendanceTrend = buildAttendanceTrendSeries(attendanceTrendRaw, ATTENDANCE_TREND_DAYS);

    return {
        totalUsers,
        students: studentCount,
        teachers: teacherCount,
        admins: adminCount,
        classes: classCount,
        notifications: notificationCount,
        totalGrades,
        averageAttendance,
        attendanceTrend,
    };
}

function buildAttendanceTrendSeries(rawRows, days) {
    const rateByDay = new Map(
        rawRows.map((row) => [
            row._id,
            row.total > 0 ? Math.round((row.present / row.total) * 1000) / 10 : 0,
        ])
    );

    const series = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() - (days - 1));

    for (let index = 0; index < days; index += 1) {
        const key = cursor.toISOString().slice(0, 10);
        series.push({
            date: key,
            rate: rateByDay.get(key) ?? 0,
        });
        cursor.setDate(cursor.getDate() + 1);
    }

    return series;
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
            meta: { name: user.name, role: user.role },
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
            meta: { studentName: attendance.student?.name || 'Student' },
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
