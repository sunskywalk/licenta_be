const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const Grade = require('../models/Grade');

// Получить общую статистику системы
const getSystemStats = async (req, res) => {
  try {
    console.log('[getSystemStats] Fetching system statistics...');

    // Параллельно получаем все необходимые данные
    const [
      totalUsers,
      studentCount,
      teacherCount,
      adminCount,
      classCount,
      notificationCount,
      attendanceData
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
      Classroom.countDocuments(),
      Notification.countDocuments(),
      Attendance.aggregate([
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            presentRecords: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    // Вычисляем средний процент посещаемости
    let averageAttendance = 0;
    if (attendanceData.length > 0 && attendanceData[0].totalRecords > 0) {
      averageAttendance = (attendanceData[0].presentRecords / attendanceData[0].totalRecords) * 100;
      averageAttendance = Math.round(averageAttendance * 10) / 10; // Округляем до 1 знака после запятой
    }

    const stats = {
      totalUsers,
      students: studentCount,
      teachers: teacherCount,
      admins: adminCount,
      classes: classCount,
      notifications: notificationCount,
      averageAttendance: averageAttendance
    };

    console.log('[getSystemStats] Statistics:', stats);
    res.json(stats);

  } catch (error) {
    console.error('[getSystemStats] Error:', error);
    res.status(500).json({ 
      message: 'Error fetching system statistics', 
      error: error.message 
    });
  }
};

// Получить недавние активности
const getRecentActivity = async (req, res) => {
  try {
    console.log('[getRecentActivity] Fetching recent activities...');

    // Получаем последние уведомления как активности
    const recentNotifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Получаем последних зарегистрированных пользователей
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name role createdAt')
      .lean();

    // Получаем последние записи посещаемости
    const recentAttendance = await Attendance.find()
      .sort({ date: -1 })
      .limit(5)
      .populate('student', 'name')
      .populate('classId', 'name')
      .lean();

    // Формируем массив активностей
    const activities = [];

    // Добавляем новых пользователей
    recentUsers.forEach(user => {
      activities.push({
        type: 'user_registered',
        icon: 'add-circle',
        color: '#00FF00',
        text: `New ${user.role} registered: ${user.name}`,
        timestamp: user.createdAt,
        time: getTimeAgo(user.createdAt)
      });
    });

    // Добавляем уведомления
    recentNotifications.slice(0, 3).forEach(notification => {
      activities.push({
        type: 'notification',
        icon: 'notifications',
        color: '#FF00FF',
        text: notification.title,
        timestamp: notification.createdAt,
        time: getTimeAgo(notification.createdAt)
      });
    });

    // Добавляем активности посещаемости
    recentAttendance.slice(0, 2).forEach(attendance => {
      activities.push({
        type: 'attendance',
        icon: 'checkmark-circle',
        color: '#FFFF33',
        text: `Attendance recorded for ${attendance.student?.name || 'Student'}`,
        timestamp: attendance.date,
        time: getTimeAgo(attendance.date)
      });
    });

    // Сортируем по времени (новые сначала) и берем топ 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    console.log('[getRecentActivity] Found activities:', sortedActivities.length);
    res.json(sortedActivities);

  } catch (error) {
    console.error('[getRecentActivity] Error:', error);
    res.status(500).json({ 
      message: 'Error fetching recent activities', 
      error: error.message 
    });
  }
};

// Получить детальную статистику по классам
const getClassStats = async (req, res) => {
  try {
    console.log('[getClassStats] Fetching class statistics...');

    const classStats = await Classroom.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'students',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'classId',
          as: 'attendanceRecords'
        }
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
                cond: { $eq: ['$$this.status', 'present'] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          attendanceRate: {
            $cond: [
              { $gt: ['$totalAttendanceRecords', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$presentCount', '$totalAttendanceRecords'] }, 100] },
                  1
                ]
              },
              0
            ]
          }
        }
      }
    ]);

    console.log('[getClassStats] Found class stats for', classStats.length, 'classes');
    res.json(classStats);

  } catch (error) {
    console.error('[getClassStats] Error:', error);
    res.status(500).json({ 
      message: 'Error fetching class statistics', 
      error: error.message 
    });
  }
};

// Вспомогательная функция для форматирования времени "назад"
const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
};

module.exports = {
  getSystemStats,
  getRecentActivity,
  getClassStats
}; 