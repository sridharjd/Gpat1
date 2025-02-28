const express = require('express');
const router = express.Router();
const { signIn, signUp, getCurrentUser, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * @route   POST /auth/signin
 * @desc    Sign in a user
 * @access  Public
 */
router.post('/signin', asyncHandler(signIn));

/**
 * @route   POST /auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', asyncHandler(signUp));

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, asyncHandler(getCurrentUser));

/**
 * @route   POST /auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', protect, asyncHandler(changePassword));

module.exports = router;