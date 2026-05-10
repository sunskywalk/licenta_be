const { ROLES } = require('./constants');

function teacherBlockedFromOtherSchedule(userRole, authUserId, pathTeacherId) {
    return userRole === ROLES.TEACHER && authUserId !== pathTeacherId;
}

module.exports = {
    teacherBlockedFromOtherSchedule,
};
