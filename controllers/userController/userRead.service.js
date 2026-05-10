const repository = require('./repository');

async function getAllUsers() {
  return repository.findAllUsersWithoutPassword();
}

async function getAdminUsers() {
  return repository.findAdminUsersSummary();
}

async function getUserById(userId) {
  return repository.findUserByIdWithoutPassword(userId);
}

module.exports = {
  getAllUsers,
  getAdminUsers,
  getUserById,
};
