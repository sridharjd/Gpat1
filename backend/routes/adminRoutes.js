const express = require('express');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Reports routes
router.get('/reports', [auth, isAdmin], adminController.getReports);
router.get('/reports/export', [auth, isAdmin], adminController.exportReport);

// User management routes
router.get('/users', [auth, isAdmin], adminController.getAllUsers);
router.get('/users/:id', [auth, isAdmin], adminController.getUserById);
router.put('/users/:id', [auth, isAdmin], adminController.updateUser);
router.delete('/users/:id', [auth, isAdmin], adminController.deleteUser);

module.exports = router;
