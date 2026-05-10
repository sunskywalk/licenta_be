const Notification = require('../../models/Notification');
const User = require('../../models/User');
const { POPULATE, ROLES } = require('./constants');

const defaultListQuery = () =>
    Notification.find()
        .populate(POPULATE.SENDER, POPULATE.SENDER_FIELDS)
        .populate(POPULATE.REPLY_TO, POPULATE.REPLY_TO_FIELDS)
        .sort({ createdAt: -1 });

async function createNotification(doc) {
    return Notification.create(doc);
}

async function listForStudent(userId) {
    return Notification.find({
        recipients: { $in: [userId] },
    })
        .populate(POPULATE.SENDER, POPULATE.SENDER_FIELDS)
        .populate(POPULATE.REPLY_TO, POPULATE.REPLY_TO_FIELDS)
        .sort({ createdAt: -1 });
}

async function listForAdmin() {
    return defaultListQuery();
}

async function listForTeacher(userId) {
    return Notification.find({
        $or: [{ senderId: userId }, { recipients: { $in: [userId] } }],
    })
        .populate(POPULATE.SENDER, POPULATE.SENDER_FIELDS)
        .populate(POPULATE.REPLY_TO, POPULATE.REPLY_TO_FIELDS)
        .sort({ createdAt: -1 });
}

async function findById(id) {
    return Notification.findById(id);
}

async function findByIdWithSenderForReply(id) {
    return Notification.findById(id).populate(POPULATE.SENDER, POPULATE.SENDER_FIELDS);
}

async function updateById(id, patch) {
    return Notification.findByIdAndUpdate(id, patch, { new: true });
}

async function deleteById(id) {
    return Notification.findByIdAndDelete(id);
}

async function findAdminIds() {
    const admins = await User.find({ role: ROLES.ADMIN }).select('_id');
    return admins.map((a) => a._id);
}

module.exports = {
    createNotification,
    listForStudent,
    listForAdmin,
    listForTeacher,
    findById,
    findByIdWithSenderForReply,
    updateById,
    deleteById,
    findAdminIds,
};
