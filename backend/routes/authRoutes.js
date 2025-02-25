const express = require('express');
const router = express.Router();
const { signIn, signUp, getCurrentUser } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Auth routes
router.post('/signin', signIn);
router.post('/signup', signUp);
router.get('/me', auth, getCurrentUser);

module.exports = router;