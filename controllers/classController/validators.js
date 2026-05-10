const { USER_ROLE } = require('./constants');

function isAdmin(user) {
  return user && user.role === USER_ROLE.ADMIN;
}

function isTeacher(user) {
  return user && user.role === USER_ROLE.TEACHER;
}

function isStudent(user) {
  return user && user.role === USER_ROLE.STUDENT;
}

module.exports = {
  isAdmin,
  isTeacher,
  isStudent,
};
