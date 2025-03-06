const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  signIn, 
  signUp, 
  getCurrentUser, 
  refreshToken, 
  signOut,
  changePassword,
  resendVerification,
  verifyEmail
} = require('../controllers/authController');

// Public routes
router.post('/signin', signIn);
router.post('/signup', signUp);
router.post('/refresh-token', refreshToken);
router.post('/resend-verification', resendVerification);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.use(protect); // Apply authentication middleware to all routes below
router.get('/me', getCurrentUser);
router.post('/signout', signOut);
router.post('/change-password', changePassword);

module.exports = router;