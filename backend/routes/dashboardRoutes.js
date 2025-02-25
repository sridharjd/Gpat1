const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Dashboard routes
router.get('/performance', dashboardController.getPerformanceData);
router.get('/recent-tests', dashboardController.getRecentTests);
router.get('/subject-performance', dashboardController.getSubjectPerformance);

module.exports = router;