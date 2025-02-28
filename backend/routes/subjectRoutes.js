const express = require('express');
const subjectController = require('../controllers/subjectController');

const router = express.Router();

// Route to fetch all subjects
router.get('/subjects', async (req, res) => {
  try {
    await subjectController.getAllSubjects(req, res);
  } catch (error) {
    console.error('Error fetching all subjects:', error);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

module.exports = router;