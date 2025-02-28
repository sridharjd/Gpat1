const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Dashboard routes
router.get('/performance', async (req, res) => {
  try {
    await dashboardController.getPerformanceData(req, res);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ message: 'Failed to fetch performance data' });
  }
});

router.get('/recent-tests', async (req, res) => {
  try {
    await dashboardController.getRecentTests(req, res);
  } catch (error) {
    console.error('Error fetching recent tests:', error);
    res.status(500).json({ message: 'Failed to fetch recent tests' });
  }
});

router.get('/subject-performance', async (req, res) => {
  try {
    await dashboardController.getSubjectPerformance(req, res);
  } catch (error) {
    console.error('Error fetching subject performance:', error);
    res.status(500).json({ message: 'Failed to fetch subject performance' });
  }
});

module.exports = router;