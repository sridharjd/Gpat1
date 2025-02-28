const db = require('../config/db');
const logger = require('../config/logger'); // Assuming a logger module is available

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      logger.error('User not logged in');
      return res.status(401).json({
        success: false,
        message: 'Please log in to access this resource'
      });
    }

    const [users] = await db.query(
      'SELECT is_admin FROM users WHERE username = ?',
      [req.user.username]
    );

    if (!users || users.length === 0 || !users[0].is_admin) {
      logger.error(`User ${req.user.username} does not have admin privileges`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  } catch (error) {
    logger.error('Error in isAdmin middleware:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = isAdmin;
