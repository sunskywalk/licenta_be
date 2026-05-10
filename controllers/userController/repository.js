const User = require('../../models/User');
const Classroom = require('../../models/Classroom');

async function findUserByEmail(email, options = {}) {
  const q = User.findOne({ email });
  if (options.populateClassRooms) {
    q.populate('classRooms');
  }
  return q;
}

async function createUserDoc(payload) {
  return User.create(payload);
}

async function findAllUsersWithoutPassword() {
  return User.find().select('-password').populate('classRooms');
}

async function findAdminUsersSummary() {
  return User.find({ role: 'admin' }).select('_id name email role');
}

async function findUserByIdWithoutPassword(id) {
  return User.findById(id).select('-password').populate('classRooms');
}

async function findUserByIdRaw(id) {
  return User.findById(id);
}

async function findClassroomsHavingMember(userId) {
  return Classroom.find({
    $or: [{ teachers: userId }, { students: userId }],
  });
}

async function findClassroomById(id) {
  return Classroom.findById(id);
}

async function saveClassroomDoc(cls) {
  return cls.save();
}

async function deleteUserDoc(userDoc) {
  return userDoc.deleteOne();
}

module.exports = {
  findUserByEmail,
  createUserDoc,
  findAllUsersWithoutPassword,
  findAdminUsersSummary,
  findUserByIdWithoutPassword,
  findUserByIdRaw,
  findClassroomsHavingMember,
  findClassroomById,
  saveClassroomDoc,
  deleteUserDoc,
};
