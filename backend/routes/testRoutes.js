const express = require('express');
const testController = require('../controllers/testController');

const router = express.Router();

router.post('/test/submit-test', testController.submitTest);

module.exports = router;