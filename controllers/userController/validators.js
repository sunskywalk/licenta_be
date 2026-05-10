const { ROLES } = require('./constants');

function isAdmin(user) {
  return Boolean(user && user.role === ROLES.ADMIN);
}

/** admin or same user id from JWT */
function canAccessProfile(req, targetUserId) {
  if (!req.user) return false;
  if (req.user.role === ROLES.ADMIN) return true;
  return req.user.userId === targetUserId;
}

module.exports = {
  isAdmin,
  canAccessProfile,
};
