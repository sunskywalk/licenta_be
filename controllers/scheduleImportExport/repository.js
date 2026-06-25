const Schedule = require('../../models/Schedule');
const Classroom = require('../../models/Classroom');
const User = require('../../models/User');
const { ROLE_TEACHER } = require('./constants');

const EXPORT_POPULATE = [
    { path: 'classId', select: 'name' },
    { path: 'periods.teacherId', select: 'name email' },
];

const EXPORT_SORT = { classId: 1, semester: 1, week: 1, dayOfWeek: 1 };

async function findSchedulesWithWeekFilter(query, weekNum) {
    const filter =
        weekNum !== undefined && weekNum !== null ? { ...query, week: weekNum } : { ...query };
    return Schedule.find(filter).populate(EXPORT_POPULATE).sort(EXPORT_SORT);
}

async function findSchedulesWithoutWeek(query) {
    return Schedule.find(query).populate(EXPORT_POPULATE).sort(EXPORT_SORT);
}

async function findClassroomById(id) {
    return Classroom.findById(id);
}

async function findClassroomByName(name) {
    return Classroom.findOne({ name });
}

async function findTeacherByEmail(email) {
    return User.findOne({ email, role: ROLE_TEACHER });
}

async function findTeacherByName(name) {
    return User.findOne({ name, role: ROLE_TEACHER });
}

async function findScheduleSlot(classId, dayOfWeek, week, semester) {
    return Schedule.findOne({ classId, dayOfWeek, week, semester });
}

async function createScheduleDoc(payload) {
    return Schedule.create(payload);
}

async function saveExistingSchedule(doc, resolvedPeriods, year) {
    doc.periods = resolvedPeriods;
    doc.year = year;
    return doc.save();
}

async function listClassesForTemplate() {
    return Classroom.find().select('name _id').sort({ name: 1 });
}

async function listTeachersForTemplate() {
    return User.find({ role: ROLE_TEACHER }).select('name email _id subjects').sort({ name: 1 });
}

module.exports = {
    findSchedulesWithWeekFilter,
    findSchedulesWithoutWeek,
    findClassroomById,
    findClassroomByName,
    findTeacherByEmail,
    findTeacherByName,
    findScheduleSlot,
    createScheduleDoc,
    saveExistingSchedule,
    listClassesForTemplate,
    listTeachersForTemplate,
};
