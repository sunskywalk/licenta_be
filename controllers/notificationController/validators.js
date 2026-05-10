const { ROLES, NOTIFICATION_TYPES } = require('./constants');

function studentCreatingNonSupport(role, type) {
    return role === ROLES.STUDENT && type !== NOTIFICATION_TYPES.SUPPORT;
}

module.exports = {
    studentCreatingNonSupport,
};
