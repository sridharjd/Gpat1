const multer = require('multer');
const express = require('express');
const questionController = require('../controllers/questionController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Define routes
router.get('/questions', questionController.getAllQuestions);
router.get('/questions/filter', questionController.getQuestionsByFilters);
router.get('/questions/years', questionController.getUniqueYears);
router.get('/questions/:id', questionController.getQuestionById);
router.put('/questions/:id', questionController.updateQuestion);
router.delete('/questions/:id', questionController.deleteQuestion);
router.post('/update_questions', upload.single('file'), questionController.updateQuestionsFromFile);

// Export the router
module.exports = router;