const express = require('express');
const performanceController = require('../controllers/performanceController');

const router = express.Router();

router.get('/performance', performanceController.getPerformance);

module.exports = router;