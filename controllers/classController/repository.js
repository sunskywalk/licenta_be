const Classroom = require('../../models/Classroom');
const User = require('../../models/User');
const Grade = require('../../models/Grade');
const Attendance = require('../../models/Attendance');
const { POPULATE_SELECT } = require('./constants');

function populateClassQuery(query) {
  return query
    .populate('teachers', POPULATE_SELECT.WITHOUT_PASSWORD)
    .populate('students', POPULATE_SELECT.WITHOUT_PASSWORD)
    .populate('homeroomTeacher', POPULATE_SELECT.NAME_EMAIL);
}

function findClassByName(name) {
  return Classroom.findOne({ name });
}

function createClass(payload) {
  return Classroom.create(payload);
}

function findAllClasses() {
  return populateClassQuery(Classroom.find());
}

function findClassById(id) {
  return Classroom.findById(id);
}

function findClassByIdPopulated(id) {
  return populateClassQuery(Classroom.findById(id));
}

function findUpdatedClass(id) {
  return Classroom.findById(id)
    .populate('teachers', POPULATE_SELECT.WITHOUT_PASSWORD)
    .populate('students', POPULATE_SELECT.WITHOUT_PASSWORD);
}

function findHomeroomViewClass(id) {
  return Classroom.findById(id)
    .populate('homeroomTeacher', POPULATE_SELECT.NAME_EMAIL)
    .populate('teachers', POPULATE_SELECT.NAME_EMAIL)
    .populate('students', POPULATE_SELECT.NAME_EMAIL);
}

function pullClassFromUsers(classId) {
  return User.updateMany(
    { classRooms: classId },
    { $pull: { classRooms: classId } }
  );
}

function findUserById(userId) {
  return User.findById(userId);
}

function findStudentsByName(searchRegex) {
  return User.find({
    role: 'student',
    name: { $regex: searchRegex },
  }).select(POPULATE_SELECT.NAME_EMAIL_CLASSROOMS).sort({ name: 1 });
}

function findTeachersByName(searchRegex) {
  return User.find({
    role: 'teacher',
    name: { $regex: searchRegex },
  }).select(POPULATE_SELECT.NAME_EMAIL).sort({ name: 1 });
}

function findClassesByIds(classIds) {
  return Classroom.find({ _id: { $in: classIds } }).select(POPULATE_SELECT.NAME_ONLY);
}

function removeStudentFromAllClasses(studentId) {
  return Classroom.updateMany(
    { students: studentId },
    { $pull: { students: studentId } }
  );
}

function findGradesByStudent(studentId) {
  return Grade.find({ student: studentId }).populate('teacher', POPULATE_SELECT.NAME_ONLY);
}

function findAttendanceByStudentSince(studentId, sinceDate) {
  return Attendance.find({
    student: studentId,
    date: { $gte: sinceDate },
  });
}

module.exports = {
  findClassByName,
  createClass,
  findAllClasses,
  findClassById,
  findClassByIdPopulated,
  findUpdatedClass,
  findHomeroomViewClass,
  pullClassFromUsers,
  findUserById,
  findStudentsByName,
  findTeachersByName,
  findClassesByIds,
  removeStudentFromAllClasses,
  findGradesByStudent,
  findAttendanceByStudentSince,
};
