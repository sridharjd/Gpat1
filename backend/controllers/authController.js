const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Sign In Function
const signIn = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const [user] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (!user.length) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user[0].id, isAdmin: user[0].is_admin }, 'your_secret_key', {
      expiresIn: '1h',
    });

    res.json({
      token,
      username: user[0].username,
      isAdmin: user[0].is_admin,
      user_id: user[0].id, // Include user_id in the response
    });
  } catch (error) {
    res.status(500).json({ message: 'Error signing in' });
  }
};

// Sign Up Function
const signUp = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const [existingUser] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)', [
      username,
      hashedPassword,
      0, // Default to non-admin user
    ]);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

module.exports = { signIn, signUp };