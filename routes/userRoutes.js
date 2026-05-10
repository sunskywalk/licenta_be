const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController/index');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', userController.loginUser);
router.post('/register', protect, userController.registerUser);
router.get('/', protect, userController.getAllUsers);
router.get('/admins', protect, userController.getAdminUsers);
router.get('/:id', protect, userController.getUserById);
router.put('/:id', protect, userController.updateUser);
router.delete('/:id', protect, userController.deleteUser);

module.exports = router;
