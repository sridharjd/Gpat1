const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const asyncHandler = require('./utils/asyncHandler');
const apiResponse = require('./utils/apiResponse');

// Routes
const authRoutes = require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const questionRoutes = require('./routes/questionRoutes');
const testRoutes = require('./routes/testRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const adminRoutes = require('./routes/adminRoutes');

const db = require('./config/db');

const app = express();

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    process.env.FRONTEND_URL || 'http://localhost:4000'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  max: 100, // limit each IP to 100 requests per windowMs
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10kb' })); // Body limit is 10kb

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Routes without /api prefix
app.use('/auth', authRoutes);
app.use('/subjects', subjectRoutes);
app.use('/questions', questionRoutes);
app.use('/tests', testRoutes);
app.use('/users', userRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/performance', performanceRoutes);
app.use('/admin', adminRoutes);

// Handle user performance updates
app.post('/updatePerformance', asyncHandler(async (req, res) => {
  const { userId, performanceMetric } = req.body;
  
  try {
    const [result] = await db.query(
      'UPDATE user_performance SET performance_metric = ? WHERE user_id = ?', 
      [performanceMetric, userId]
    );

    if (result.affectedRows === 0) {
      return apiResponse.notFound(res, 'User performance not found');
    }

    return apiResponse.success(res, 'Performance updated successfully');
  } catch (error) {
    return apiResponse.error(res, 'Error updating performance', error);
  }
}));

// Handle undefined routes
app.all('*', (req, res) => {
  return apiResponse.notFound(res, `Can't find ${req.originalUrl} on this server!`);
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return apiResponse.error(res, 'Validation Error', err.errors || err.message, 400);
  }
  
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return apiResponse.error(res, 'Invalid or expired token', null, 401);
  }
  
  // Default error response
  return apiResponse.error(
    res, 
    err.message || 'Server Error', 
    process.env.NODE_ENV === 'development' ? err.stack : undefined,
    err.statusCode || 500
  );
});

module.exports = app;