const Grade = require('../../models/Grade');
const User = require('../../models/User');
const Attendance = require('../../models/Attendance');
const Classroom = require('../../models/Classroom');
const Schedule = require('../../models/Schedule');
const { POPULATE_FIELDS, PASSWORD_FIELD } = require('./constants');
const { isSameId, subjectsMatch } = require('./helpers');

function populateGradeQuery(query) {
  let populated = query;
  POPULATE_FIELDS.forEach((field) => {
    populated = populated.populate(field, PASSWORD_FIELD);
  });
  return populated;
}

function findTeacherById(teacherId) {
  return User.findById(teacherId);
}

function findStudentById(studentId) {
  return User.findById(studentId);
}

function createGrade(payload) {
  return Grade.create(payload);
}

function findAllGrades() {
  return populateGradeQuery(Grade.find());
}

function findGradeById(id) {
  return populateGradeQuery(Grade.findById(id));
}

function findGradeByIdRaw(id) {
  return Grade.findById(id);
}

function updateGradeById(id, payload) {
  return populateGradeQuery(Grade.findByIdAndUpdate(id, payload, { new: true }));
}

function deleteGradeById(id) {
  return Grade.findByIdAndDelete(id);
}

function findGradesByFilter(filter) {
  return populateGradeQuery(Grade.find(filter));
}

function findGradesByFilterRaw(filter) {
  return Grade.find(filter);
}

function subjectRegex(subject) {
  const escaped = String(subject).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

function countTeacherGradesBySubject(teacherId, subject) {
  return Grade.countDocuments({
    teacher: teacherId,
    subject: { $regex: subjectRegex(subject) },
  });
}

async function findDistinctTeacherClassIdsBySubject(teacherId, subject) {
  const regex = subjectRegex(subject);

  const gradeClassIds = await Grade.distinct('classId', {
    teacher: teacherId,
    subject: { $regex: regex },
  });

  const schedules = await Schedule.find({ 'periods.teacherId': teacherId }).select('classId periods');
  const scheduleClassIds = schedules
    .filter((schedule) =>
      schedule.periods?.some(
        (period) => period.subject && subjectsMatch(period.subject, subject)
      )
    )
    .map((schedule) => schedule.classId)
    .filter(Boolean);

  return [...new Set([
    ...gradeClassIds.map(String),
    ...scheduleClassIds.map(String),
  ])];
}

async function findDistinctSubjectsByClassId(classId) {
  const schedules = await Schedule.find({ classId });
  const subjects = new Set();

  schedules.forEach((schedule) => {
    schedule.periods?.forEach((period) => {
      if (period.subject) {
        subjects.add(period.subject);
      }
    });
  });

  return Array.from(subjects);
}

function findClassroomsByIds(classIds) {
  return Classroom.find({ _id: { $in: classIds } })
    .populate('students', PASSWORD_FIELD)
    .populate('teachers', PASSWORD_FIELD)
    .populate('homeroomTeacher', PASSWORD_FIELD);
}

function findHomeroomClassByTeacher(teacherId) {
  return Classroom.findOne({ homeroomTeacher: teacherId })
    .populate('students', PASSWORD_FIELD)
    .populate('teachers', PASSWORD_FIELD)
    .populate('homeroomTeacher', PASSWORD_FIELD);
}

function findAllSchedulesWithClass() {
  return Schedule.find({}).populate('classId');
}

function findClassroomByIdWithStudents(classId) {
  return Classroom.findById(classId).populate('students', '_id name');
}

function findClassroomById(classId) {
  return Classroom.findById(classId);
}

function findAttendanceByFilter(filter) {
  return Attendance.find(filter);
}

module.exports = {
  findTeacherById,
  findStudentById,
  createGrade,
  findAllGrades,
  findGradeById,
  findGradeByIdRaw,
  updateGradeById,
  deleteGradeById,
  findGradesByFilter,
  findGradesByFilterRaw,
  countTeacherGradesBySubject,
  findDistinctTeacherClassIdsBySubject,
  findDistinctSubjectsByClassId,
  findClassroomsByIds,
  findHomeroomClassByTeacher,
  findAllSchedulesWithClass,
  findClassroomByIdWithStudents,
  findClassroomById,
  findAttendanceByFilter,
};
