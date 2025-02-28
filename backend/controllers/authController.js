const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to generate tokens
const generateToken = (payload, expiresIn = '1h') => {
  if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      throw new Error('Server configuration error');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn,
      algorithm: 'HS256'
  });
};

// Error handling function
const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ message, error: error.message });
};

// Sign In Function
const signIn = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Email and password are required' 
    });
  }

  try {
    const [user] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user[0]) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Create token payload
const payload = { 
    id: user[0].id,
    isAdmin: Boolean(user[0].is_admin)
};

    // Generate access token
    const token = generateToken(payload);

    // Update last login timestamp
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user[0].id]
    );

    // Log successful login
    console.log(`User logged in: ${user[0].email} (ID: ${user[0].id})`);
    console.log('Generated token:', token);

    res.json({
      success: true,
      token,
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        isAdmin: Boolean(user[0].is_admin)
      }
    });
  } catch (error) {
    handleError(res, error, 'Error signing in');
  }
};

// Sign Up Function
const signUp = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phoneNumber } = req.body;

    if (!username || !email || !password || !firstName || !lastName) {
      return handleError(res, new Error('Missing fields'), 'All required fields must be provided', 400);
    }

    // Check for existing user
    const [existingUser] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?', 
      [email, username]
    );

    if (existingUser.length > 0) {
      const field = existingUser[0].email === email ? 'email' : 'username';
      return handleError(res, new Error(`This ${field} is already registered`), `This ${field} is already registered`, 400);
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

    console.log('User registered successfully:', username);

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
    handleError(res, error, 'Error registering user');
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [user] = await db.query(
      `SELECT 
        id, 
        username, 
        email, 
        first_name, 
        last_name, 
        phone_number, 
        is_admin, 
        created_at, 
        last_login 
      FROM users 
      WHERE id = ?`,
      [userId]
    );
    
    if (!user[0]) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Get user stats
    let stats = { total_tests: 0, avg_score: 0, total_time: 0 };
    
    try {
      const [statsResult] = await db.query(
        `SELECT 
          COUNT(id) as total_tests,
          AVG(score) as avg_score,
          SUM(time_taken) as total_time
        FROM test_results
        WHERE user_id = ?`,
        [userId]
      );
      
      if (statsResult && statsResult.length > 0) {
        stats = statsResult[0];
      }
    } catch (error) {
      console.log('Error fetching user stats:', error.message);
      // Continue execution even if stats query fails
    }
    
    res.json({
      success: true,
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        phoneNumber: user[0].phone_number,
        isAdmin: Boolean(user[0].is_admin),
        createdAt: user[0].created_at,
        lastLogin: user[0].last_login,
        stats: stats
      }
    });
  } catch (error) {
    handleError(res, error, 'Error fetching current user');
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Get current user
    const [user] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user[0]) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user[0].password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    handleError(res, error, 'Error changing password');
  }
};

module.exports = { 
  signIn, 
  signUp, 
  getCurrentUser,
  changePassword
};