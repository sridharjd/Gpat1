const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/errors');
const logger = require('../config/logger');
const cache = require('../config/cache');
const db = require('../config/db').pool;

const protect = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');
    const cookieToken = req.cookies.refreshToken;
    const token = headerToken || cookieToken;

    if (!token) {
      throw new ApiError('No authentication token provided', 401);
    }

    // Try to get decoded token from cache
    const cacheKey = `token:${token}`;
    let decoded = await cache.get(cacheKey);
    let user = null;

    if (!decoded) {
      // Verify token
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new ApiError('Token has expired', 401);
        }
        throw new ApiError('Invalid token', 401);
      }

      // Get user from database
      const [users] = await db.query(
        'SELECT * FROM users WHERE id = ? AND is_active = true',
        [decoded.id]
      );

      user = users[0];
      if (!user) {
        throw new ApiError('User not found or inactive', 401);
      }

      // Cache decoded token
      await cache.set(cacheKey, decoded, 60 * 15); // Cache for 15 minutes
    } else {
      // Get user from database if we got decoded from cache
      const [users] = await db.query(
        'SELECT * FROM users WHERE id = ? AND is_active = true',
        [decoded.id]
      );

      user = users[0];
      if (!user) {
        throw new ApiError('User not found or inactive', 401);
      }
    }

    // Attach user and admin status to request
    req.user = {
      ...user,
      id: user.id,
      isAdmin: Boolean(user.is_admin)
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect
};