const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const authRoutes = require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const questionRoutes = require('./routes/questionRoutes');
const testRoutes = require('./routes/testRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/db'); // Updated path to db.js

const app = express();

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3001', 'http://localhost:3001', 'http://localhost:3001', process.env.FRONTEND_URL || 'http://localhost:4000', 'http://localhost:3001'],
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
app.post('/updatePerformance', (req, res) => {
    const { userId, performanceMetric } = req.body;
    // Logic to update user performance in the database
    db.query('UPDATE user_performance SET performance_metric = ? WHERE user_id = ?', [performanceMetric, userId], (error, results) => {
        if (error) return res.status(500).send('Error updating performance');
        res.send('Performance updated successfully');
    });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;