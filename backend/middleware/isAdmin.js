const db = require('../config/db');

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
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
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = isAdmin;
