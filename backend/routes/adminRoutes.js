const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const { 
  getUsers, 
  getUserById,
  createUser,
  getAnalytics,
  exportReport,
  getDashboardOverview,
  getPerformanceAnalytics,
  getSubjects,
  manageSubject,
  getTestStats,
  getUserStats,
  getPerformanceStats,
  getDashboardStats,
  updateUserStatus
} = require('../controllers/adminController');

// User management routes
router.get('/users', protect, isAdmin, getUsers);
router.get('/users/:id', protect, isAdmin, getUserById);
router.post('/users', protect, isAdmin, createUser);
router.patch('/users/:id/status', protect, isAdmin, updateUserStatus);

// Analytics routes
router.get('/analytics', protect, isAdmin, getAnalytics);
router.get('/reports/export', protect, isAdmin, exportReport);
router.get('/overview', protect, isAdmin, getDashboardOverview);
router.get('/performance', protect, isAdmin, getPerformanceAnalytics);

// Subject management routes
router.get('/subjects', protect, isAdmin, getSubjects);
router.post('/subjects', protect, isAdmin, manageSubject);
router.put('/subjects/:id', protect, isAdmin, manageSubject);

// Stats routes
router.get('/stats/tests', protect, isAdmin, getTestStats);
router.get('/stats/users', protect, isAdmin, getUserStats);
router.get('/stats/performance', protect, isAdmin, getPerformanceStats);
router.get('/stats/dashboard', protect, isAdmin, getDashboardStats);

module.exports = router;