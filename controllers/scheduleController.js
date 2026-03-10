// controllers/scheduleController.js
const Schedule = require('../models/Schedule');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const Grade = require('../models/Grade');
const Homework = require('../models/Homework');
const academicConfig = require('../config/academicConfig');

// Функция конвертации времени в минуты для корректного сравнения
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Функция проверки конфликтов расписания
const checkScheduleConflicts = async (
  classId,
  dayOfWeek,
  week,
  semester,
  year,
  periods,
  excludeScheduleId = null
) => {
  const conflicts = [];

  // Получаем расписания ТОЛЬКО для конкретного дня/недели/семестра/года
  const query = {
    dayOfWeek: dayOfWeek,
    week: week,
    semester: semester,
    year: year,
    ...(excludeScheduleId && { _id: { $ne: excludeScheduleId } })
  };

  const existingSchedules = await Schedule.find(query)
    .populate('classId', 'name')
    .populate('periods.teacherId', 'name');

  // Проверяем каждый период нового расписания
  for (const newPeriod of periods) {
    // Конвертируем в минуты для численного сравнения
    const newStartMinutes = timeToMinutes(newPeriod.startTime);
    const newEndMinutes = timeToMinutes(newPeriod.endTime);
    const newTeacherId = newPeriod.teacherId;

    // Проверяем конфликты с существующими расписаниями
    for (const existingSchedule of existingSchedules) {
      for (const existingPeriod of existingSchedule.periods) {
        // Конвертируем существующее время в минуты
        const existingStartMinutes = timeToMinutes(existingPeriod.startTime);
        const existingEndMinutes = timeToMinutes(existingPeriod.endTime);
        const existingTeacherId = existingPeriod.teacherId._id;

        // Проверяем пересечение временных интервалов (численное сравнение)
        const timesOverlap = (
          newStartMinutes < existingEndMinutes &&
          newEndMinutes > existingStartMinutes
        );

        if (timesOverlap) {
          // Конфликт учителя - один учитель в разных классах в одно время
          if (newTeacherId.toString() === existingTeacherId.toString()) {
            conflicts.push({
              type: 'teacher_conflict',
              message: `Учитель ${existingPeriod.teacherId.name} уже назначен на ${existingPeriod.startTime}-${existingPeriod.endTime} в классе ${existingSchedule.classId.name}`,
              time: `${existingPeriod.startTime}-${existingPeriod.endTime}`,
              teacher: existingPeriod.teacherId.name,
              conflictClass: existingSchedule.classId.name,
              subject: existingPeriod.subject
            });
          }

          // Конфликт класса - один класс не может иметь два урока одновременно
          if (classId.toString() === existingSchedule.classId._id.toString()) {
            conflicts.push({
              type: 'class_conflict',
              message: `Класс ${existingSchedule.classId.name} уже имеет урок ${existingPeriod.subject} в ${existingPeriod.startTime}-${existingPeriod.endTime}`,
              time: `${existingPeriod.startTime}-${existingPeriod.endTime}`,
              class: existingSchedule.classId.name,
              conflictSubject: existingPeriod.subject
            });
          }
        }
      }
    }
  }

  return conflicts;
};

exports.createSchedule = async (req, res) => {
  try {
    const { classId, dayOfWeek, week, semester, year, periods } = req.body;

    // Проверяем конфликты перед созданием (с новыми параметрами)
    const conflicts = await checkScheduleConflicts(
      classId,
      dayOfWeek,
      week,
      semester,
      year,
      periods
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Конфликт расписания! Расписание не может быть создано.',
        conflicts: conflicts
      });
    }

    const schedule = await Schedule.create({
      classId,
      dayOfWeek,
      week,
      semester,
      year,
      periods,
    });

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('classId')
      .populate('periods.teacherId', '-password');

    // Сортируем периоды по времени
    populatedSchedule.periods.sort((a, b) => a.startTime.localeCompare(b.startTime));

    res.status(201).json({ message: 'Расписание создано', schedule: populatedSchedule });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate({
        path: 'classId',
        populate: {
          path: 'students teachers',
          select: 'name email role'
        }
      })
      .populate('periods.teacherId', 'name email');

    // Сортируем периоды по времени для каждого расписания
    schedules.forEach(schedule => {
      schedule.periods.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('classId')
      .populate('periods.teacherId', '-password');
    if (!schedule) {
      return res.status(404).json({ message: 'Не найдено' });
    }

    // Сортируем периоды по времени
    schedule.periods.sort((a, b) => a.startTime.localeCompare(b.startTime));

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { classId, dayOfWeek, week, semester, year, periods } = req.body;

    // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем конфликты перед обновлением!
    const conflicts = await checkScheduleConflicts(
      classId,
      dayOfWeek,
      week,
      semester,
      year,
      periods,
      req.params.id // Исключаем текущее расписание из проверки
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Конфликт расписания при обновлении!',
        conflicts: conflicts
      });
    }

    const updated = await Schedule.findByIdAndUpdate(
      req.params.id,
      { classId, dayOfWeek, week, semester, year, periods },
      { new: true, runValidators: true } // runValidators для проверки времени
    ).populate('classId').populate('periods.teacherId', '-password');

    if (!updated) {
      return res.status(404).json({ message: 'Не найдено' });
    }

    // Сортируем периоды по времени
    updated.periods.sort((a, b) => a.startTime.localeCompare(b.startTime));

    res.json({ message: 'Расписание обновлено', schedule: updated });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Не найдено' });
    }
    res.json({ message: 'Расписание удалено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// @desc    Get all schedules for a specific teacher
// @route   GET /api/schedules/teacher/:teacherId
// @access  Private (Teacher, Admin)
exports.getTeacherSchedule = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Учитель может видеть только свое расписание
    if (req.user.role === 'teacher' && req.user.userId !== teacherId) {
      return res.status(403).json({ message: 'Нет прав' });
    }

    // Найти все расписания, где учитель ведет уроки
    const schedules = await Schedule.find({ 'periods.teacherId': teacherId })
      .populate({
        path: 'classId',
        populate: {
          path: 'students teachers',
          select: 'name email role'
        }
      })
      .populate('periods.teacherId', 'name email');

    // Сортируем периоды по времени для каждого расписания
    schedules.forEach(schedule => {
      schedule.periods.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    console.log(`📅 Found ${schedules.length} schedules for teacher ${teacherId}`);
    if (schedules.length > 0) {
      console.log(`📖 Sample schedule:`, {
        class: schedules[0].classId.name,
        day: schedules[0].dayOfWeek,
        periods: schedules[0].periods.length
      });
    }

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all schedules for a specific class
// @route   GET /api/schedules/class/:classId
// @access  Private
exports.getScheduleByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const schedules = await Schedule.find({ classId })
      .populate({
        path: 'classId',
        populate: {
          path: 'students teachers',
          select: 'name email role'
        }
      })
      .populate('periods.teacherId', 'name email');

    // Сортируем периоды по времени для каждого расписания
    schedules.forEach(schedule => {
      schedule.periods.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching class schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all schedules for a specific day of week
// @route   GET /api/schedules/day/:dayOfWeek
// @access  Private
exports.getScheduleByDay = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;

    const schedules = await Schedule.find({ dayOfWeek: parseInt(dayOfWeek) })
      .populate({
        path: 'classId',
        populate: {
          path: 'students teachers',
          select: 'name email role'
        }
      })
      .populate('periods.teacherId', 'name email');

    // Сортируем периоды по времени для каждого расписания
    schedules.forEach(schedule => {
      schedule.periods.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json(schedules);
  } catch (error) {
    console.error('Error getting week dates:', error);
    res.status(500).json({ message: 'Ошибка при получении дат недели', error: error.message });
  }
};

// ============================
// Get schedule with events for a specific date
// ============================
exports.getScheduleWithEvents = async (req, res) => {
  try {
    const { userId, date } = req.params;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    console.log('[getScheduleWithEvents] userId:', userId, 'date:', date);

    // Get user to determine role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = checkDate.getDay();

    // Import SchoolEvent model
    const SchoolEvent = require('../models/SchoolEvent');

    // Check for school events on this date
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await SchoolEvent.find({
      startDate: { $lte: endOfDay },
      endDate: { $gte: checkDate },
    }).populate('classId', 'name');

    console.log('[getScheduleWithEvents] Found events:', events.length);

    // Determine which events apply to this user
    let applicableEvent = null;
    let userClassId = null;

    if (user.role === 'student') {
      userClassId = user.classRooms;
    }

    // Check for school-wide events first (vacation, holiday)
    const schoolWideEvent = events.find(e =>
      e.affectsAllSchool && (e.type === 'vacation' || e.type === 'holiday')
    );

    if (schoolWideEvent) {
      applicableEvent = schoolWideEvent;
    } else if (userClassId) {
      // Check for class-specific events
      const classEvent = events.find(e =>
        !e.affectsAllSchool && e.classId && e.classId._id.toString() === userClassId.toString()
      );
      if (classEvent) {
        applicableEvent = classEvent;
      }
    }

    // Check for shortened day (school-wide)
    const shortenedDayEvent = events.find(e =>
      e.affectsAllSchool && e.type === 'shortened_day'
    );

    // Get schedule for this day
    let schedule = null;
    let lessons = [];

    if (user.role === 'student' && userClassId) {
      schedule = await Schedule.findOne({
        classId: userClassId,
        dayOfWeek: dayOfWeek,
      }).populate('periods.teacherId', 'name email');

      if (schedule) {
        lessons = schedule.periods.map(period => ({
          subject: period.subject,
          teacher: period.teacherId ? period.teacherId.name : 'Unknown',
          teacherId: period.teacherId ? period.teacherId._id : null,
          startTime: period.startTime,
          endTime: period.endTime,
          room: period.room,
          status: 'normal',
        }));
      }
    } else if (user.role === 'teacher') {
      // Get all schedules where this teacher teaches
      const schedules = await Schedule.find({
        dayOfWeek: dayOfWeek,
        'periods.teacherId': userId,
      }).populate('classId', 'name');

      lessons = [];
      for (const sched of schedules) {
        for (const period of sched.periods) {
          if (period.teacherId && period.teacherId.toString() === userId) {
            lessons.push({
              subject: period.subject,
              className: sched.classId.name,
              classId: sched.classId._id,
              startTime: period.startTime,
              endTime: period.endTime,
              room: period.room,
              status: 'normal',
            });
          }
        }
      }
    }

    // Apply event logic
    let responseData = {
      date: checkDate.toISOString().split('T')[0],
      dayOfWeek: dayOfWeek,
      eventType: 'normal',
      eventName: null,
      lessons: lessons,
    };

    // If vacation or holiday, return event info with no lessons
    if (applicableEvent && (applicableEvent.type === 'vacation' || applicableEvent.type === 'holiday')) {
      responseData.eventType = applicableEvent.type;
      responseData.eventName = applicableEvent.name;
      responseData.lessons = [];
    }
    // If class exception, mark affected lessons as cancelled
    else if (applicableEvent && applicableEvent.type === 'class_exception') {
      responseData.eventType = 'class_exception';
      responseData.eventName = applicableEvent.name;

      if (user.role === 'student') {
        // All lessons cancelled for student
        responseData.lessons = [];
      } else if (user.role === 'teacher') {
        // Mark lessons for this specific class as cancelled
        responseData.lessons = lessons.map(lesson => {
          if (lesson.classId && lesson.classId.toString() === applicableEvent.classId._id.toString()) {
            return { ...lesson, status: 'cancelled' };
          }
          return lesson;
        });
      }
    }
    // If shortened day, adjust times
    else if (shortenedDayEvent) {
      responseData.eventType = 'shortened_day';
      responseData.eventName = shortenedDayEvent.name;

      const lessonDuration = shortenedDayEvent.shortenedSchedule?.lessonDuration || 30;
      const breakDuration = shortenedDayEvent.shortenedSchedule?.breakDuration || 5;

      // Recalculate times
      responseData.lessons = lessons.map((lesson, index) => {
        const startMinutes = 480 + index * (lessonDuration + breakDuration); // Start at 8:00 AM
        const endMinutes = startMinutes + lessonDuration;

        const startHours = Math.floor(startMinutes / 60);
        const startMins = startMinutes % 60;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;

        return {
          ...lesson,
          startTime: `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}`,
          endTime: `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`,
        };
      });
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error getting schedule with events:', error);
    res.status(500).json({ message: 'Ошибка при получении расписания', error: error.message });
  }
};

// Получить детали урока для студента
exports.getStudentLessonDetails = async (req, res) => {
  try {
    const { studentId, subject, date } = req.params;

    console.log(`📚 Fetching lesson details for student: ${studentId}, subject: ${subject}, date: ${date}`);

    // Парсим дату
    const lessonDate = new Date(date);
    const startOfDay = new Date(lessonDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(lessonDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Получаем студента и его класс
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Получаем оценки за этот урок
    const grades = await Grade.find({
      student: studentId,
      subject: subject,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ createdAt: -1 });

    // Получаем домашние задания по предмету (активные на эту дату)
    const homework = await Homework.find({
      subject: subject,
      $or: [
        { dueDate: { $gte: startOfDay, $lte: endOfDay } }, // Задания на сегодня
        {
          createdAt: { $lte: endOfDay },
          dueDate: { $gte: lessonDate } // Активные задания
        }
      ]
    }).sort({ createdAt: -1 }).limit(3);

    // Получаем последний комментарий учителя по этому предмету
    const recentGradeWithComment = await Grade.findOne({
      student: studentId,
      subject: subject,
      comment: { $exists: true, $ne: '' }
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${grades.length} grades, ${homework.length} homework, comment: ${recentGradeWithComment?.comment || 'none'}`);

    res.json({
      subject: subject,
      date: date,
      grades: grades.map(grade => ({
        _id: grade._id,
        value: grade.value,
        type: grade.type,
        comment: grade.comment || '',
        createdAt: grade.createdAt
      })),
      homework: homework.map(hw => ({
        _id: hw._id,
        title: hw.title,
        description: hw.description || '',
        dueDate: hw.dueDate,
        createdAt: hw.createdAt
      })),
      teacherComment: recentGradeWithComment?.comment || null,
      lastCommentDate: recentGradeWithComment?.createdAt || null
    });

  } catch (error) {
    console.error('Error fetching lesson details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current academic year, semester, and week
// @route   GET /api/schedule/current-week
// @access  Private
exports.getCurrentAcademicInfo = async (req, res) => {
  try {
    // Try async version first (uses AcademicYear DB model)
    let info;
    try {
      info = await academicConfig.getCurrentWeekAndSemesterAsync();
    } catch (e) {
      // Fallback to sync version
      info = academicConfig.getCurrentWeekAndSemester();
    }
    const config = academicConfig.getAcademicYearConfig();

    res.json({
      ...info,
      // Include currentYear for frontend display
      currentYear: info.academicYear || config.academicYear,
      academicYearLabel: `${info.academicYear || config.academicYear}-${(info.academicYear || config.academicYear) + 1}`,
      semester1: {
        start: config.semester1.start.toISOString().split('T')[0],
        end: config.semester1.end.toISOString().split('T')[0],
      },
      semester2: {
        start: config.semester2.start.toISOString().split('T')[0],
        end: config.semester2.end.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Error getting academic info:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dates for a specific week in a semester
// @route   GET /api/schedule/week-dates/:semester/:week
// @access  Private
exports.getWeekDates = async (req, res) => {
  try {
    const { semester, week } = req.params;
    const semesterNum = parseInt(semester);
    const weekNum = parseInt(week);

    if (isNaN(semesterNum) || isNaN(weekNum) || weekNum < 1) {
      return res.status(400).json({
        message: 'Invalid semester or week.'
      });
    }

    const dates = await academicConfig.getWeekDates(semesterNum, weekNum);
    const weekStart = await academicConfig.getWeekStartDate(semesterNum, weekNum);

    // Calculate weekend end
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    res.json({
      semester: semesterNum,
      week: weekNum,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      dates,
    });
  } catch (error) {
    console.error('Error getting week dates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};