const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { ApiError } = require('./errors');

/**
 * Generate access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} - Object containing access and refresh tokens
 */
const generateTokens = async (user) => {
  const payload = {
    id: user.id,
    isAdmin: Boolean(user.is_admin),
    isVerified: Boolean(user.is_verified)
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpirationMinutes,
    algorithm: 'HS256'
  });

  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpirationDays,
    algorithm: 'HS256'
  });

  return {
    accessToken,
    refreshToken
  };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 * @throws {ApiError} - If token is invalid or expired
 */
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError('Token has expired', 401);
    }
    throw new ApiError('Invalid token', 401);
  }
};

/**
 * Extract token from request header
 * @param {Object} req - Express request object
 * @returns {string|null} - Token or null if not found
 */
const extractToken = (req) => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.substring(7);
  }
  return null;
};

/**
 * Authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new ApiError('Authentication token is required', 401);
    }

    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Admin authorization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authorizeAdmin = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      throw new ApiError('Admin access required', 403);
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verified user middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireVerified = async (req, res, next) => {
  try {
    if (!req.user?.isVerified) {
      throw new ApiError('Email verification required', 403);
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateTokens,
  verifyToken,
  extractToken,
  authenticate,
  authorizeAdmin,
  requireVerified
}; 