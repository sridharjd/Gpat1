const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to generate tokens
const generateToken = (payload, expiresIn = '1h') => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your_secret_key', { expiresIn });
};

// Sign In Function
const signIn = async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: 'Username/Email and password are required' });
  }

  try {
    // Check if the userId is an email or username
    const [user] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?', 
      [userId, userId]
    );

    if (!user.length) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ 
      id: user[0].id, 
      isAdmin: user[0].is_admin 
    });

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user[0].id]);

    res.json({
      token,
      user: {
        id: user[0].id,
        username: user[0].username,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        email: user[0].email,
        isAdmin: user[0].is_admin,
      }
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ message: 'Error signing in' });
  }
};

// Sign Up Function
const signUp = async (req, res) => {
  const { username, email, password, firstName, lastName, phoneNumber } = req.body;

  if (!username || !email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  try {
    // Check for existing user
    const [existingUser] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?', 
      [email, username]
    );

    if (existingUser.length > 0) {
      const field = existingUser[0].email === email ? 'email' : 'username';
      return res.status(400).json({ message: `This ${field} is already registered` });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [result] = await db.query(
      `INSERT INTO users (username, email, password, first_name, last_name, phone_number, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, firstName, lastName, phoneNumber, true]
    );

    const token = generateToken({ 
      id: result.insertId,
      isAdmin: false
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        username,
        firstName,
        lastName,
        email,
        isAdmin: false
      }
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const [user] = await db.query(
      'SELECT id, username, email, first_name, last_name, is_admin FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user[0].id,
        username: user[0].username,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        email: user[0].email,
        isAdmin: user[0].is_admin
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Error getting user information' });
  }
};

module.exports = { 
  signIn, 
  signUp, 
  getCurrentUser
};