const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
  try {
    let token = req.header('Authorization');

    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Remove Bearer prefix if present
    token = token.replace('Bearer ', '');

    // Check if this is a development mock token
    const isDevelopmentMockToken = process.env.NODE_ENV === 'development' && 
                                  token.split('.').length === 3;
    
    let decoded;
    
    if (isDevelopmentMockToken) {
      try {
        // For development, try to decode the token without verification
        const tokenParts = token.split('.');
        const payloadBase64 = tokenParts[1];
        // Base64 decode the payload
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
        decoded = JSON.parse(payloadJson);
        console.log('Development mode: Using mock token payload:', decoded);
      } catch (error) {
        console.error('Error decoding mock token:', error);
        return res.status(401).json({ message: 'Invalid token format' });
      }
    } else {
      // For production, verify the token signature
      try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
          console.error('JWT_SECRET is not set in environment variables');
          return res.status(500).json({ message: 'Server configuration error' });
        }
        
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ message: 'Token is invalid or expired' });
      }
    }
    
    // Get user from database to ensure they still exist
    try {
      const [user] = await db.query(
        'SELECT id, username, email, first_name, last_name, is_admin FROM users WHERE id = ?',
        [decoded.id]
      );

      if (!user.length) {
        console.error('User not found in database');
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user[0];
      next();
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { protect };