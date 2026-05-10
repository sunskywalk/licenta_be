const Schedule = require('../../models/Schedule');
const User = require('../../models/User');
const Grade = require('../../models/Grade');
const Homework = require('../../models/Homework');
const SchoolEvent = require('../../models/SchoolEvent');
const { POPULATE } = require('./constants');

async function findSchedulesForConflictCheck(dayOfWeek, week, semester, year, excludeScheduleId) {
    const query = {
        dayOfWeek,
        week,
        semester,
        year,
        ...(excludeScheduleId && { _id: { $ne: excludeScheduleId } }),
    };
    return Schedule.find(query).populate('classId', 'name').populate('periods.teacherId', 'name');
}

async function insertSchedule(body) {
    return Schedule.create(body);
}

async function findByIdWithClassAndTeachers(id) {
    return Schedule.findById(id).populate('classId').populate('periods.teacherId', POPULATE.TEACHER_NO_PASSWORD);
}

async function findAllSchedulesDeepPopulate() {
    return Schedule.find()
        .populate(POPULATE.CLASS_DEEP)
        .populate(POPULATE.TEACHER_PUBLIC, POPULATE.TEACHER_PUBLIC_FIELDS);
}

async function updateScheduleById(id, patch) {
    return Schedule.findByIdAndUpdate(id, patch, { new: true, runValidators: true })
        .populate('classId')
        .populate('periods.teacherId', POPULATE.TEACHER_NO_PASSWORD);
}

async function deleteScheduleById(id) {
    return Schedule.findByIdAndDelete(id);
}

async function findSchedulesByTeacherId(teacherId) {
    return Schedule.find({ 'periods.teacherId': teacherId })
        .populate(POPULATE.CLASS_DEEP)
        .populate(POPULATE.TEACHER_PUBLIC, POPULATE.TEACHER_PUBLIC_FIELDS);
}

async function findSchedulesByClassId(classId) {
    return Schedule.find({ classId })
        .populate(POPULATE.CLASS_DEEP)
        .populate(POPULATE.TEACHER_PUBLIC, POPULATE.TEACHER_PUBLIC_FIELDS);
}

async function findSchedulesByDayOfWeek(dayOfWeek) {
    return Schedule.find({ dayOfWeek })
        .populate(POPULATE.CLASS_DEEP)
        .populate(POPULATE.TEACHER_PUBLIC, POPULATE.TEACHER_PUBLIC_FIELDS);
}

async function findUserById(userId) {
    return User.findById(userId);
}

async function findSchoolEventsForDay(checkDate, endOfDay) {
    return SchoolEvent.find({
        startDate: { $lte: endOfDay },
        endDate: { $gte: checkDate },
    }).populate('classId', 'name');
}

async function findStudentScheduleForDay(classId, dayOfWeek) {
    return Schedule.findOne({
        classId,
        dayOfWeek,
    }).populate('periods.teacherId', 'name email');
}

async function findTeacherSchedulesForDay(dayOfWeek, teacherId) {
    return Schedule.find({
        dayOfWeek,
        'periods.teacherId': teacherId,
    }).populate(POPULATE.CLASS_NAME_ONLY, POPULATE.CLASS_NAME_FIELDS);
}

async function findGradesForLessonWindow(studentId, subject, startOfDay, endOfDay) {
    return Grade.find({
        student: studentId,
        subject,
        createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
        },
    }).sort({ createdAt: -1 });
}

async function findHomeworkForLesson(subject, startOfDay, endOfDay, lessonDate) {
    return Homework.find({
        subject,
        $or: [
            { dueDate: { $gte: startOfDay, $lte: endOfDay } },
            {
                createdAt: { $lte: endOfDay },
                dueDate: { $gte: lessonDate },
            },
        ],
    })
        .sort({ createdAt: -1 })
        .limit(3);
}

async function findLatestGradeWithComment(studentId, subject) {
    return Grade.findOne({
        student: studentId,
        subject,
        comment: { $exists: true, $ne: '' },
    }).sort({ createdAt: -1 });
}

module.exports = {
    findSchedulesForConflictCheck,
    insertSchedule,
    findByIdWithClassAndTeachers,
    findAllSchedulesDeepPopulate,
    updateScheduleById,
    deleteScheduleById,
    findSchedulesByTeacherId,
    findSchedulesByClassId,
    findSchedulesByDayOfWeek,
    findUserById,
    findSchoolEventsForDay,
    findStudentScheduleForDay,
    findTeacherSchedulesForDay,
    findGradesForLessonWindow,
    findHomeworkForLesson,
    findLatestGradeWithComment,
};
