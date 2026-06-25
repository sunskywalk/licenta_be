const User = require('../../models/User');
const Classroom = require('../../models/Classroom');
const Attendance = require('../../models/Attendance');
const Notification = require('../../models/Notification');
const Grade = require('../../models/Grade');
const { FETCH_LIMITS, ATTENDANCE_STATUS } = require('./constants');

async function countTotalUsers() {
    return User.countDocuments();
}

async function countUsersWithRole(role) {
    return User.countDocuments({ role });
}

async function countClassrooms() {
    return Classroom.countDocuments();
}

async function countNotifications() {
    return Notification.countDocuments();
}

async function countGrades() {
    return Grade.countDocuments({ type: { $ne: 'final' } });
}

async function aggregateAttendanceTrend(days = 7) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    return Attendance.aggregate([
        { $match: { date: { $gte: since } } },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$date' },
                },
                total: { $sum: 1 },
                present: {
                    $sum: {
                        $cond: [{ $eq: ['$status', ATTENDANCE_STATUS.PRESENT] }, 1, 0],
                    },
                },
            },
        },
        { $sort: { _id: 1 } },
    ]);
}

async function aggregateAttendancePresentTotals() {
    return Attendance.aggregate([
        {
            $group: {
                _id: null,
                totalRecords: { $sum: 1 },
                presentRecords: {
                    $sum: {
                        $cond: [{ $eq: ['$status', ATTENDANCE_STATUS.PRESENT] }, 1, 0],
                    },
                },
            },
        },
    ]);
}

async function findRecentNotificationsDesc(limit = FETCH_LIMITS.NOTIFICATIONS) {
    return Notification.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
}

async function findRecentUsersDesc(limit = FETCH_LIMITS.USERS) {
    return User.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name role createdAt')
        .lean();
}

async function findRecentAttendanceDesc(limit = FETCH_LIMITS.ATTENDANCE) {
    return Attendance.find()
        .sort({ date: -1 })
        .limit(limit)
        .populate('student', 'name')
        .populate('classId', 'name')
        .lean();
}

async function aggregateClassStatistics() {
    return Classroom.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'students',
                foreignField: '_id',
                as: 'studentDetails',
            },
        },
        {
            $lookup: {
                from: 'attendances',
                localField: '_id',
                foreignField: 'classId',
                as: 'attendanceRecords',
            },
        },
        {
            $project: {
                name: 1,
                subject: 1,
                studentCount: { $size: '$studentDetails' },
                totalAttendanceRecords: { $size: '$attendanceRecords' },
                presentCount: {
                    $size: {
                        $filter: {
                            input: '$attendanceRecords',
                            cond: { $eq: ['$$this.status', ATTENDANCE_STATUS.PRESENT] },
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                attendanceRate: {
                    $cond: [
                        { $gt: ['$totalAttendanceRecords', 0] },
                        {
                            $round: [
                                {
                                    $multiply: [
                                        { $divide: ['$presentCount', '$totalAttendanceRecords'] },
                                        100,
                                    ],
                                },
                                1,
                            ],
                        },
                        0,
                    ],
                },
            },
        },
    ]);
}

module.exports = {
    countTotalUsers,
    countUsersWithRole,
    countClassrooms,
    countNotifications,
    countGrades,
    aggregateAttendanceTrend,
    aggregateAttendancePresentTotals,
    findRecentNotificationsDesc,
    findRecentUsersDesc,
    findRecentAttendanceDesc,
    aggregateClassStatistics,
};
