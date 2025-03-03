const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { 
  signUp, 
  signIn, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');

router.post('/signup', asyncHandler(signUp));
router.post('/signin', asyncHandler(signIn));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));

module.exports = router;