const multer = require('multer');
const express = require('express');
const questionController = require('../controllers/questionController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Define routes
router.get('/questions', async (req, res) => {
  try {
    await questionController.getAllQuestions(req, res);
  } catch (error) {
    console.error('Error fetching all questions:', error);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

router.get('/questions/filter', async (req, res) => {
  try {
    await questionController.getQuestionsByFilters(req, res);
  } catch (error) {
    console.error('Error fetching questions by filters:', error);
    res.status(500).json({ message: 'Failed to fetch filtered questions' });
  }
});

router.get('/questions/years', async (req, res) => {
  try {
    await questionController.getUniqueYears(req, res);
  } catch (error) {
    console.error('Error fetching unique years:', error);
    res.status(500).json({ message: 'Failed to fetch unique years' });
  }
});

router.get('/questions/:id', async (req, res) => {
  try {
    await questionController.getQuestionById(req, res);
  } catch (error) {
    console.error('Error fetching question by ID:', error);
    res.status(500).json({ message: 'Failed to fetch question' });
  }
});

router.put('/questions/:id', async (req, res) => {
  try {
    await questionController.updateQuestion(req, res);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Failed to update question' });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    await questionController.deleteQuestion(req, res);
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Failed to delete question' });
  }
});

router.post('/update_questions', upload.single('file'), async (req, res) => {
  try {
    await questionController.updateQuestionsFromFile(req, res);
  } catch (error) {
    console.error('Error updating questions from file:', error);
    res.status(500).json({ message: 'Failed to update questions from file' });
  }
});

// Export the router
module.exports = router;