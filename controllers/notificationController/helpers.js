// dumb linear scan but collections are tiny here
function recipientListIncludesUser(notification, userId) {
    return notification.recipients.map((r) => r.toString()).includes(userId);
}

module.exports = {
    recipientListIncludesUser,
};
