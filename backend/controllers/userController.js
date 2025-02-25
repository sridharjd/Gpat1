const db = require('../config/db');
const User = require('../models/user');
const UserPerformance = require('../models/userperformance');

// Existing User Management Functions
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, email, is_admin, created_at FROM users');
    res.json(users);
  } catch (err) {
    console.error('Users fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const [user] = await db.query(
      'SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (!user[0]) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user[0]);
  } catch (err) {
    console.error('User fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { username, email, isAdmin } = req.body;
    
    await db.query(
      'UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email), is_admin = COALESCE(?, is_admin) WHERE id = ?',
      [username, email, isAdmin, req.params.id]
    );
    
    const [updatedUser] = await db.query(
      'SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (!updatedUser[0]) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser[0]);
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('User delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Profile Management
const getProfile = async (req, res) => {
  try {
    const [user] = await db.query(
      'SELECT id, username, email, phone_number, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user[0]) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user[0]);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, phoneNumber, bio } = req.body;
    
    await db.query(
      'UPDATE users SET username = COALESCE(?, username), phone_number = COALESCE(?, phone_number), bio = COALESCE(?, bio) WHERE id = ?',
      [username, phoneNumber, bio, req.user.id]
    );
    
    const [updatedUser] = await db.query(
      'SELECT id, username, email, phone_number, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    res.json(updatedUser[0]);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Test History Management
const getTestHistory = async (req, res) => {
  try {
    const [tests] = await db.query(
      `SELECT up.id, up.score, up.total_questions, up.created_at as completed_at,
       CONCAT('Test ', DATE_FORMAT(up.created_at, '%Y-%m-%d')) as test_name
       FROM user_performance up
       WHERE up.username = (SELECT username FROM users WHERE id = ?)
       ORDER BY up.created_at DESC`,
      [req.user.id]
    );
    
    const formattedTests = tests.map(test => ({
      ...test,
      duration: 30, // Default duration if not stored
      score: (test.score / test.total_questions) * 100 // Convert to percentage
    }));
    
    res.json(formattedTests);
  } catch (err) {
    console.error('Test history fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTestById = async (req, res) => {
  try {
    const [test] = await db.query(
      `SELECT up.*, 
       CONCAT('Test ', DATE_FORMAT(up.created_at, '%Y-%m-%d')) as test_name
       FROM user_performance up
       WHERE up.id = ? AND up.username = (SELECT username FROM users WHERE id = ?)`,
      [req.params.id, req.user.id]
    );
    
    if (!test[0]) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    const formattedTest = {
      ...test[0],
      duration: 30, // Default duration if not stored
      score: (test[0].score / test[0].total_questions) * 100 // Convert to percentage
    };
    
    res.json(formattedTest);
  } catch (err) {
    console.error('Test fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Settings Management
const getSettings = async (req, res) => {
  try {
    const [settings] = await db.query(
      'SELECT email_notifications, dark_mode, show_progress, auto_save_answers FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );
    
    // If no settings exist, return defaults
    if (!settings[0]) {
      return res.json({
        emailNotifications: true,
        darkMode: false,
        showProgress: true,
        autoSaveAnswers: true
      });
    }
    
    // Convert snake_case to camelCase
    res.json({
      emailNotifications: settings[0].email_notifications,
      darkMode: settings[0].dark_mode,
      showProgress: settings[0].show_progress,
      autoSaveAnswers: settings[0].auto_save_answers
    });
  } catch (err) {
    console.error('Settings fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { setting, value } = req.body;
    
    // Convert camelCase to snake_case
    const settingMap = {
      emailNotifications: 'email_notifications',
      darkMode: 'dark_mode',
      showProgress: 'show_progress',
      autoSaveAnswers: 'auto_save_answers'
    };

    const dbSetting = settingMap[setting];
    if (!dbSetting) {
      return res.status(400).json({ message: 'Invalid setting' });
    }

    // Check if settings exist for user
    const [existingSettings] = await db.query(
      'SELECT id FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    if (existingSettings.length === 0) {
      // Create new settings with defaults
      await db.query(
        'INSERT INTO user_settings (user_id, email_notifications, dark_mode, show_progress, auto_save_answers) VALUES (?, true, false, true, true)',
        [req.user.id]
      );
    }

    // Update the specific setting
    await db.query(
      `UPDATE user_settings SET ${dbSetting} = ? WHERE user_id = ?`,
      [value, req.user.id]
    );

    // Get updated settings
    const [updatedSettings] = await db.query(
      'SELECT email_notifications, dark_mode, show_progress, auto_save_answers FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    // Convert snake_case to camelCase
    res.json({
      emailNotifications: updatedSettings[0].email_notifications,
      darkMode: updatedSettings[0].dark_mode,
      showProgress: updatedSettings[0].show_progress,
      autoSaveAnswers: updatedSettings[0].auto_save_answers
    });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export the functions
module.exports = { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getProfile, 
  updateProfile, 
  getTestHistory, 
  getTestById, 
  getSettings, 
  updateSettings 
};