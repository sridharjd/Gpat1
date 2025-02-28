const express = require('express');
const testController = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

// Apply authentication middleware to all routes except public ones
router.use(protect);

/**
 * @route   GET /tests/filters
 * @desc    Get test filters (subjects and years)
 * @access  Private
 */
router.get('/filters', asyncHandler(testController.getTestFilters));

/**
 * @route   GET /tests/questions
 * @desc    Get questions for a test based on filters
 * @access  Private
 */
router.get('/questions', asyncHandler(testController.getTestQuestions));

/**
 * @route   GET /tests/exams/info
 * @desc    Get exam information
 * @access  Private
 */
router.get('/exams/info', asyncHandler(testController.getExamInfo));

/**
 * @route   POST /tests/submit
 * @desc    Submit a completed test
 * @access  Private
 */
router.post('/submit', asyncHandler(testController.submitTest));

/**
 * @route   GET /tests/history
 * @desc    Get user's test history
 * @access  Private
 */
router.get('/history', asyncHandler(testController.getTestHistory));

/**
 * @route   GET /tests/:id
 * @desc    Get a specific test result by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(testController.getTestById));

module.exports = router;