const db = require('../config/db');
const User = require('../models/User');
const UserPerformance = require('../models/userperformance');

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ message, error: error.message });
};

// Existing User Management Functions
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, email, is_admin, created_at FROM users');
    res.json(users);
  } catch (err) {
    console.error('Error fetching all users:', err);
    handleError(res, err, 'Failed to fetch all users', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const [user] = await db.query(
      'SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (!user[0]) {
      console.error(`User with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user[0]);
  } catch (err) {
    console.error(`Error fetching user with ID ${req.params.id}:`, err);
    handleError(res, err, 'Failed to fetch user', 500);
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
      console.error(`User with ID ${req.params.id} not found after update`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser[0]);
  } catch (err) {
    console.error(`Error updating user with ID ${req.params.id}:`, err);
    handleError(res, err, 'Failed to update user', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      console.error(`User with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(`Error deleting user with ID ${req.params.id}:`, err);
    handleError(res, err, 'Failed to delete user', 500);
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
      console.error(`User with ID ${req.user.id} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user[0]);
  } catch (err) {
    console.error(`Error fetching profile for user with ID ${req.user.id}:`, err);
    handleError(res, err, 'Failed to fetch profile', 500);
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
    console.error(`Error updating profile for user with ID ${req.user.id}:`, err);
    handleError(res, err, 'Failed to update profile', 500);
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
    console.error(`Error fetching test history for user with ID ${req.user.id}:`, err);
    handleError(res, err, 'Failed to fetch test history', 500);
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
      console.error(`Test with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Test not found' });
    }
    
    const formattedTest = {
      ...test[0],
      duration: 30, // Default duration if not stored
      score: (test[0].score / test[0].total_questions) * 100 // Convert to percentage
    };
    
    res.json(formattedTest);
  } catch (err) {
    console.error(`Error fetching test with ID ${req.params.id}:`, err);
    handleError(res, err, 'Failed to fetch test', 500);
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
    console.error(`Error fetching settings for user with ID ${req.user.id}:`, err);
    handleError(res, err, 'Failed to fetch settings', 500);
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
      console.error(`Invalid setting: ${setting}`);
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
    console.error(`Error updating settings for user with ID ${req.user.id}:`, err);
    handleError(res, err, 'Failed to update settings', 500);
  }
};

const getUserSettings = async (req, res) => {
  try {
    const [settings] = await db.query(
      'SELECT auto_save_answers FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    if (!settings[0]) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    res.json({
      success: true,
      data: settings[0]
    });
  } catch (error) {
    handleError(res, error, 'Error fetching user settings');
  }
};

const updateUserSettings = async (req, res) => {
  const { setting, value } = req.body;

  if (!setting || value === undefined) {
    return res.status(400).json({ message: 'Setting and value are required' });
  }

  try {
    const dbSetting = settingMap[setting];
    if (!dbSetting) {
      return res.status(400).json({ message: 'Invalid setting' });
    }

    await db.query(
      `UPDATE user_settings SET ${dbSetting} = ? WHERE user_id = ?`,
      [value, req.user.id]
    );

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    handleError(res, error, 'Error updating user settings');
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
  updateSettings, 
  getUserSettings, 
  updateUserSettings 
};