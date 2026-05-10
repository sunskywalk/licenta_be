const readService = require('./scheduleRead.service');
const writeService = require('./scheduleWrite.service');
const withEventsService = require('./scheduleWithEvents.service');
const extrasService = require('./scheduleExtras.service');
const { teacherBlockedFromOtherSchedule } = require('./validators');
const { MESSAGES } = require('./constants');

async function createSchedule(req, res) {
    try {
        const result = await writeService.createSchedule(req.body);
        if (!result.ok && result.conflicts) {
            return res.status(409).json({
                message: result.message,
                conflicts: result.conflicts,
            });
        }
        res.status(201).json({
            message: MESSAGES.CREATED,
            schedule: result.schedule,
        });
    } catch (error) {
        res.status(500).json({ message: MESSAGES.ERROR, error: error.message });
    }
}

async function getAllSchedules(req, res) {
    try {
        const schedules = await readService.getAllSchedules();
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: MESSAGES.ERROR, error: error.message });
    }
}

async function getScheduleById(req, res) {
    try {
        const schedule = await readService.getScheduleById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ message: MESSAGES.NOT_FOUND });
        }
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: MESSAGES.ERROR, error: error.message });
    }
}

async function updateSchedule(req, res) {
    try {
        const result = await writeService.updateSchedule(req.params.id, req.body);
        if (!result.ok && result.conflicts) {
            return res.status(409).json({
                message: result.message,
                conflicts: result.conflicts,
            });
        }
        if (!result.ok && result.notFound) {
            return res.status(404).json({ message: MESSAGES.NOT_FOUND });
        }
        res.json({ message: MESSAGES.UPDATED, schedule: result.schedule });
    } catch (error) {
        res.status(500).json({ message: MESSAGES.ERROR, error: error.message });
    }
}

async function deleteSchedule(req, res) {
    try {
        const { deleted } = await writeService.deleteSchedule(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: MESSAGES.NOT_FOUND });
        }
        res.json({ message: MESSAGES.DELETED });
    } catch (error) {
        res.status(500).json({ message: MESSAGES.ERROR, error: error.message });
    }
}

async function getTeacherSchedule(req, res) {
    try {
        const { teacherId } = req.params;

        if (teacherBlockedFromOtherSchedule(req.user.role, req.user.userId, teacherId)) {
            return res.status(403).json({ message: MESSAGES.NO_ACCESS });
        }

        const schedules = await readService.getTeacherSchedule(teacherId);
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching teacher schedule:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function getScheduleByClass(req, res) {
    try {
        const schedules = await readService.getScheduleByClass(req.params.classId);
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching class schedule:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function getScheduleByDay(req, res) {
    try {
        const schedules = await readService.getScheduleByDay(req.params.dayOfWeek);
        res.json(schedules);
    } catch (error) {
        console.error('Error getting week dates:', error);
        res.status(500).json({
            message: MESSAGES.DAY_FETCH_ERROR,
            error: error.message,
        });
    }
}

async function getScheduleWithEvents(req, res) {
    try {
        const { userId, date } = req.params;
        const result = await withEventsService.getScheduleWithEvents(userId, date);

        if (result.notFoundUser) {
            return res.status(404).json({ message: MESSAGES.USER_NOT_FOUND });
        }

        res.json(result.data);
    } catch (error) {
        console.error('Error getting schedule with events:', error);
        res.status(500).json({
            message: MESSAGES.SCHEDULE_FETCH_ERROR,
            error: error.message,
        });
    }
}

async function getStudentLessonDetails(req, res) {
    try {
        const { studentId, subject, date } = req.params;
        const payload = await extrasService.getStudentLessonDetails(studentId, subject, date);

        if (payload.notFoundStudent) {
            return res.status(404).json({ message: MESSAGES.STUDENT_NOT_FOUND });
        }

        res.json(payload);
    } catch (error) {
        console.error('Error fetching lesson details:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR });
    }
}

async function getCurrentAcademicInfo(req, res) {
    try {
        const body = await extrasService.getCurrentAcademicInfo();
        res.json(body);
    } catch (error) {
        console.error('Error getting academic info:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR });
    }
}

async function getWeekDates(req, res) {
    try {
        const result = await extrasService.getWeekDates(req.params.semester, req.params.week);
        if (result.invalid) {
            return res.status(400).json({
                message: MESSAGES.INVALID_SEMESTER_WEEK,
            });
        }
        res.json(result);
    } catch (error) {
        console.error('Error getting week dates:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR });
    }
}

module.exports = {
    createSchedule,
    getAllSchedules,
    getScheduleById,
    updateSchedule,
    deleteSchedule,
    getTeacherSchedule,
    getScheduleByClass,
    getScheduleByDay,
    getScheduleWithEvents,
    getStudentLessonDetails,
    getCurrentAcademicInfo,
    getWeekDates,
};
