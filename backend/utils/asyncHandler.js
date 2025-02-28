/**
 * Async handler to wrap async route handlers
 * Eliminates the need for try/catch blocks in route handlers
 * @param {Function} fn - Async function to execute
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error(`Error in ${fn.name || 'async handler'}:`, err);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: err.errors || err.message
      });
    }
    
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Default error response
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
};

module.exports = { asyncHandler };
