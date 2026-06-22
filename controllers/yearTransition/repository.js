const Classroom = require('../../models/Classroom');
const User = require('../../models/User');
const StudentClassHistory = require('../../models/StudentClassHistory');
const AcademicYear = require('../../models/AcademicYear/index');
const { generatePeriodsFromPreset } = require('../../config/academicYearPresets');

function findAllClassrooms() {
  return Classroom.find().populate('students', '_id name email');
}

function findClassroomByName(name) {
  return Classroom.findOne({ name });
}

function findActiveAcademicYear() {
  return AcademicYear.getActive();
}

function createAcademicYear(payload) {
  return AcademicYear.create(payload);
}

function saveClassroom(classroom) {
  return classroom.save();
}

function saveUser(user) {
  return user.save();
}

function createHistoryEntry(payload) {
  return StudentClassHistory.create(payload);
}

function findHistoryByStudent(studentId) {
  return StudentClassHistory.find({ student: studentId })
    .sort({ academicYear: -1 });
}

function findDistinctGradeYears() {
  const Grade = require('../../models/Grade');
  return Grade.distinct('academicYear');
}

function findUserById(userId) {
  return User.findById(userId);
}

module.exports = {
  findAllClassrooms,
  findClassroomByName,
  findActiveAcademicYear,
  createAcademicYear,
  saveClassroom,
  saveUser,
  createHistoryEntry,
  findHistoryByStudent,
  findDistinctGradeYears,
  findUserById,
};
