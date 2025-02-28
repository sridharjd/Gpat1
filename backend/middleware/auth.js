const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure the path is correct

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

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
                
                // For mock tokens, we'll use the id as userId
                decoded.userId = decoded.id;
            } catch (error) {
                console.error('Error decoding mock token:', error);
                return res.status(401).json({ message: 'Invalid token format' });
            }
        } else {
            // For production, verify the token signature
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }
        
        const userId = decoded.userId; 
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Error in authentication middleware:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = auth;
