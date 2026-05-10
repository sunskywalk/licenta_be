const repository = require('./repository');
const { ROLES, EVENT_TYPES, LESSON_STATUS } = require('./constants');

async function getScheduleWithEvents(userId, dateStr) {
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);

    const user = await repository.findUserById(userId);
    if (!user) {
        return { notFoundUser: true };
    }

    const dayOfWeek = checkDate.getDay();

    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await repository.findSchoolEventsForDay(checkDate, endOfDay);

    let applicableEvent = null;
    let userClassId = null;

    if (user.role === ROLES.STUDENT) {
        userClassId = user.classRooms;
    }

    const schoolWideEvent = events.find(
        (e) => e.affectsAllSchool && (e.type === EVENT_TYPES.VACATION || e.type === EVENT_TYPES.HOLIDAY)
    );

    if (schoolWideEvent) {
        applicableEvent = schoolWideEvent;
    } else if (userClassId) {
        const classEvent = events.find(
            (e) =>
                !e.affectsAllSchool &&
                e.classId &&
                e.classId._id.toString() === userClassId.toString()
        );
        if (classEvent) {
            applicableEvent = classEvent;
        }
    }

    const shortenedDayEvent = events.find(
        (e) => e.affectsAllSchool && e.type === EVENT_TYPES.SHORTENED_DAY
    );

    let lessons = [];

    if (user.role === ROLES.STUDENT && userClassId) {
        const schedule = await repository.findStudentScheduleForDay(userClassId, dayOfWeek);

        if (schedule) {
            lessons = schedule.periods.map((period) => ({
                subject: period.subject,
                teacher: period.teacherId ? period.teacherId.name : 'Unknown',
                teacherId: period.teacherId ? period.teacherId._id : null,
                startTime: period.startTime,
                endTime: period.endTime,
                room: period.room,
                status: LESSON_STATUS.NORMAL,
            }));
        }
    } else if (user.role === ROLES.TEACHER) {
        const schedules = await repository.findTeacherSchedulesForDay(dayOfWeek, userId);

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
                        status: LESSON_STATUS.NORMAL,
                    });
                }
            }
        }
    }

    let responseData = {
        date: checkDate.toISOString().split('T')[0],
        dayOfWeek,
        eventType: EVENT_TYPES.NORMAL,
        eventName: null,
        lessons,
    };

    if (
        applicableEvent &&
        (applicableEvent.type === EVENT_TYPES.VACATION || applicableEvent.type === EVENT_TYPES.HOLIDAY)
    ) {
        responseData.eventType = applicableEvent.type;
        responseData.eventName = applicableEvent.name;
        responseData.lessons = [];
    } else if (applicableEvent && applicableEvent.type === EVENT_TYPES.CLASS_EXCEPTION) {
        responseData.eventType = EVENT_TYPES.CLASS_EXCEPTION;
        responseData.eventName = applicableEvent.name;

        if (user.role === ROLES.STUDENT) {
            responseData.lessons = [];
        } else if (user.role === ROLES.TEACHER) {
            responseData.lessons = lessons.map((lesson) => {
                if (
                    lesson.classId &&
                    lesson.classId.toString() === applicableEvent.classId._id.toString()
                ) {
                    return { ...lesson, status: LESSON_STATUS.CANCELLED };
                }
                return lesson;
            });
        }
    } else if (shortenedDayEvent) {
        responseData.eventType = EVENT_TYPES.SHORTENED_DAY;
        responseData.eventName = shortenedDayEvent.name;

        const lessonDuration = shortenedDayEvent.shortenedSchedule?.lessonDuration || 30;
        const breakDuration = shortenedDayEvent.shortenedSchedule?.breakDuration || 5;

        responseData.lessons = lessons.map((lesson, index) => {
            const startMinutes = 480 + index * (lessonDuration + breakDuration);
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

    return { ok: true, data: responseData };
}

module.exports = {
    getScheduleWithEvents,
};
