const express = require('express');
const subjectController = require('../controllers/subjectController');

const router = express.Router();

// Route to fetch all subjects
router.get('/subjects', subjectController.getAllSubjects);

module.exports = router;