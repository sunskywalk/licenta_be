const Attendance = require('../../models/Attendance');
const User = require('../../models/User');
const Grade = require('../../models/Grade');

async function findUserById(userId) {
  return User.findById(userId);
}

async function findOneAttendance(condition) {
  return Attendance.findOne(condition);
}

async function updateAttendanceById(id, patch, options) {
  return Attendance.findByIdAndUpdate(id, patch, options);
}

async function createAttendanceDocument(data) {
  return Attendance.create(data);
}

async function saveNewAttendanceFromBody(body) {
  const doc = new Attendance(body);
  return doc.save();
}

async function findAttendanceForClassOnDate(classId, attendanceDate) {
  return Attendance.find({ classId, date: attendanceDate })
    .populate('student', 'name')
    .populate('teacher', 'name');
}

async function findAllAttendancePopulated() {
  return Attendance.find()
    .populate('student', 'name')
    .populate('classId', 'name')
    .populate('teacher', 'name');
}

async function findAttendanceByIdPopulated(id) {
  return Attendance.findById(id)
    .populate('student', 'name')
    .populate('classId', 'name')
    .populate('teacher', 'name');
}

async function updateAttendanceRaw(id, body, options) {
  return Attendance.findByIdAndUpdate(id, body, options);
}

async function deleteAttendanceById(id) {
  return Attendance.findByIdAndDelete(id);
}

async function findAttendanceByStudent(studentId) {
  return Attendance.find({ student: studentId })
    .populate('classId', 'name')
    .populate('teacher', 'name')
    .sort({ date: -1 });
}

async function findAttendanceByFilterSorted(filter) {
  return Attendance.find(filter).sort({ date: -1 });
}

async function findAttendanceByTeacher(teacherId) {
  return Attendance.find({ teacher: teacherId })
    .populate('student', '-password')
    .populate('classId');
}

async function findAttendanceByClassId(classId) {
  return Attendance.find({ classId });
}

async function findAttendanceByClassPopulated(classId) {
  return Attendance.find({ classId })
    .populate('student', 'name')
    .populate('teacher', 'name')
    .sort({ date: -1 });
}

async function findAttendanceByDateRaw(dateParam) {
  return Attendance.find({ date: dateParam })
    .populate('student', 'name')
    .populate('classId', 'name')
    .populate('teacher', 'name')
    .sort({ classId: 1 });
}

async function insertManyAttendance(records) {
  return Attendance.insertMany(records);
}

async function findGradesForStudent(studentId) {
  return Grade.find({ student: studentId }).sort({ createdAt: -1 });
}

async function findAttendanceForStudentWithGradesView(studentId) {
  return Attendance.find({ student: studentId })
    .populate('classId', 'name')
    .populate('teacher', 'name')
    .sort({ date: -1 });
}

module.exports = {
  findUserById,
  findOneAttendance,
  updateAttendanceById,
  createAttendanceDocument,
  saveNewAttendanceFromBody,
  findAttendanceForClassOnDate,
  findAllAttendancePopulated,
  findAttendanceByIdPopulated,
  updateAttendanceRaw,
  deleteAttendanceById,
  findAttendanceByStudent,
  findAttendanceByFilterSorted,
  findAttendanceByTeacher,
  findAttendanceByClassId,
  findAttendanceByClassPopulated,
  findAttendanceByDateRaw,
  insertManyAttendance,
  findGradesForStudent,
  findAttendanceForStudentWithGradesView,
};
