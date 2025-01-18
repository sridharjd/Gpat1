const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const questionRoutes = require('./routes/questionRoutes');
const testRoutes = require('./routes/testRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const performanceRoutes = require('./routes/performanceRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', subjectRoutes);
app.use('/api', questionRoutes);
app.use('/api', testRoutes);
app.use('/api', userRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', performanceRoutes);

module.exports = app;