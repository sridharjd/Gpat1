const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Profile routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

// Settings routes
router.get('/settings', auth, userController.getSettings);
router.put('/settings', auth, userController.updateSettings);

// Test history routes
router.get('/tests/history', auth, userController.getTestHistory);
router.get('/tests/history/:id', auth, userController.getTestById);

// Existing routes
router.get('/users', auth, userController.getAllUsers);
router.get('/users/:id', auth, userController.getUserById);
router.put('/users/:id', auth, userController.updateUser);
router.delete('/users/:id', auth, userController.deleteUser);

module.exports = router;