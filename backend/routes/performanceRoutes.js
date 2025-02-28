const express = require('express');
const performanceController = require('../controllers/performanceController');

const router = express.Router();

router.get('/performance', async (req, res) => {
  try {
    await performanceController.getPerformance(req, res);
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ message: 'Failed to fetch performance' });
  }
});

module.exports = router;