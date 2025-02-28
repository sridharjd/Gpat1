const express = require('express');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Reports routes
router.get('/reports', [auth, isAdmin], async (req, res) => {
  try {
    await adminController.getReports(req, res);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

router.get('/reports/export', [auth, isAdmin], async (req, res) => {
  try {
    await adminController.exportReport(req, res);
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({ message: 'Failed to export reports' });
  }
});

// User management routes
router.get('/users', [auth, isAdmin], async (req, res) => {
  try {
    await adminController.getAllUsers(req, res);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', [auth, isAdmin], async (req, res) => {
  try {
    await adminController.getUserById(req, res);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.put('/users/:id', [auth, isAdmin], async (req, res) => {
  try {
    await adminController.updateUser(req, res);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.delete('/users/:id', [auth, isAdmin], async (req, res) => {
  try {
    await adminController.deleteUser(req, res);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
