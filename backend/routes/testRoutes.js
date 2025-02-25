const express = require('express');
const testController = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware
router.use(protect);

// Get test filters
router.get('/filters', testController.getTestFilters);

// Get questions for a test
router.get('/questions', testController.getTestQuestions);

// Submit a completed test
router.post('/submit', testController.submitTest);

module.exports = router;