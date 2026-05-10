const service = require('./service');
const { MESSAGES } = require('./constants');
const { isAdmin, canAccessProfile } = require('./validators');

function sendResult(res, result) {
  return res.status(result.status).json(result.body);
}

async function registerUser(req, res) {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: MESSAGES.ADMIN_ONLY_CREATE });
    }
    const result = await service.registerUser(req.body);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: MESSAGES.CREATE_USER_ERROR, error: error.message });
  }
}

async function loginUser(req, res) {
  try {
    const result = await service.loginUser(req.body);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: MESSAGES.LOGIN_ERROR, error: error.message });
  }
}

async function getAllUsers(req, res) {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: MESSAGES.FORBIDDEN });
    }
    const users = await service.getAllUsers();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: MESSAGES.LIST_USERS_ERROR, error: error.message });
  }
}

async function getAdminUsers(req, res) {
  try {
    const adminUsers = await service.getAdminUsers();
    return res.json(adminUsers);
  } catch (error) {
    return res.status(500).json({ message: MESSAGES.LIST_ADMINS_ERROR, error: error.message });
  }
}

async function getUserById(req, res) {
  try {
    const userId = req.params.id;
    if (!canAccessProfile(req, userId)) {
      return res.status(403).json({ message: MESSAGES.FORBIDDEN });
    }
    const user = await service.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: MESSAGES.NOT_FOUND_SHORT });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: MESSAGES.GENERIC_ERROR, error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    if (!canAccessProfile(req, userId)) {
      return res.status(403).json({ message: MESSAGES.FORBIDDEN });
    }
    const result = await service.updateUser(userId, req.body, req.user);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: MESSAGES.UPDATE_ERROR, error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: MESSAGES.DELETE_FORBIDDEN });
    }
    const result = await service.deleteUser(req.params.id);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: MESSAGES.DELETE_ERROR, error: error.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getAdminUsers,
  getUserById,
  updateUser,
  deleteUser,
};
