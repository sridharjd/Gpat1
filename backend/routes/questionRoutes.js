const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const {
  getRandomQuestions,
  getAllQuestions,
  getQuestionsByFilters,
  getUniqueYears,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  updateQuestionsFromFile
} = require('../controllers/questionController');

// Multer configuration
const upload = multer({ storage: multer.memoryStorage() });

// Protected routes - require authentication
router.use(protect);

// Question retrieval routes
router.get('/test', getRandomQuestions);
router.get('/', getAllQuestions);
router.get('/filter', getQuestionsByFilters);
router.get('/years', getUniqueYears);
router.get('/:id', getQuestionById);

// Admin-only routes
router.put('/:id', isAdmin, updateQuestion);
router.delete('/:id', isAdmin, deleteQuestion);
router.post('/bulk-update', isAdmin, upload.single('file'), updateQuestionsFromFile);

module.exports = router;