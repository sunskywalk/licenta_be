const { ROLES } = require('./constants');
const { sameId } = require('./helpers');

function canManageHomework(role) {
    return role === ROLES.TEACHER || role === ROLES.ADMIN;
}

// student role can only hit their own id, admins/teachers pass through
function studentMayViewTargetStudent(studentRole, requestUserId, targetStudentId) {
    if (studentRole !== ROLES.STUDENT) {
        return true;
    }
    return sameId(requestUserId, targetStudentId);
}

// teacher role can only hit their own teacher id
function teacherMayViewTargetTeacher(teacherRole, requestUserId, targetTeacherId) {
    if (teacherRole !== ROLES.TEACHER) {
        return true;
    }
    return sameId(requestUserId, targetTeacherId);
}

module.exports = {
    canManageHomework,
    studentMayViewTargetStudent,
    teacherMayViewTargetTeacher,
};
