const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const { 
  getUsers, 
  getReports, 
  exportReport,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getTestStats,
  exportUsers,
  exportTestStats
} = require('../controllers/adminController');

// Protect these routes with authentication and admin check
router.get('/users', protect, isAdmin, asyncHandler(getUsers));
router.get('/reports', protect, isAdmin, asyncHandler(getReports));
router.get('/reports/export', protect, isAdmin, asyncHandler(exportReport));
router.get('/test-stats', protect, isAdmin, asyncHandler(getTestStats));
router.get('/users/export', protect, isAdmin, asyncHandler(exportUsers));
router.get('/test-stats/export', protect, isAdmin, asyncHandler(exportTestStats));

// Additional user management routes
router.get('/users/:id', protect, isAdmin, asyncHandler(getUserById));
router.post('/users', protect, isAdmin, asyncHandler(createUser));
router.put('/users/:id', protect, isAdmin, asyncHandler(updateUser));
router.delete('/users/:id', protect, isAdmin, asyncHandler(deleteUser));

module.exports = router;