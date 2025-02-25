const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    
    // Get user from database to ensure they still exist
    const [user] = await db.query(
      'SELECT id, username, email, first_name, last_name, is_admin FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user.length) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      ...decoded,
      username: user[0].username,
      email: user[0].email
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { protect };