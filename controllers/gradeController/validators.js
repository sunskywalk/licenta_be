const { ROLES } = require('./constants');

function canManageGrades(role) {
  return role === ROLES.TEACHER || role === ROLES.ADMIN;
}

function canReadTeacherGrades(role) {
  return role === ROLES.ADMIN || role === ROLES.TEACHER;
}

function isStudent(role) {
  return role === ROLES.STUDENT;
}

function isTeacher(role) {
  return role === ROLES.TEACHER;
}

module.exports = {
  canManageGrades,
  canReadTeacherGrades,
  isStudent,
  isTeacher,
};
