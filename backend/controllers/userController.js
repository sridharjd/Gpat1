const db = require('../config/db').pool;
const logger = require('../config/logger');
const { validateUsername, validateEmail, validatePhone, sanitizeUser } = require('../utils/validation');
const { ApiError } = require('../utils/errors');
const { catchAsync } = require('../utils/errors');
const User = require('../models/user');
const UserPerformance = require('../models/UserPerformance');
const asyncHandler = require('../utils/asyncHandler');

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ message, error: error.message });
};

// Get all users (admin only)
const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('-password');
  res.json({ success: true, data: users });
});

// Get user by ID (admin or self)
const getUserById = catchAsync(async (req, res) => {
  const userId = req.params.id;
  
  // Check authorization
  if (!req.user.isAdmin && req.user.id !== parseInt(userId)) {
    throw new ApiError('Not authorized to access this user', 403);
  }

  const [users] = await db.query(`
    SELECT 
      u.*,
      COUNT(DISTINCT tr.id) as total_tests,
      ROUND(AVG(tr.score), 2) as avg_score,
      MAX(tr.score) as highest_score
    FROM users u
    LEFT JOIN test_results tr ON tr.user_id = u.id
    WHERE u.id = ? AND u.is_active = true
    GROUP BY u.id
  `, [userId]);

  if (!users[0]) {
    throw new ApiError('User not found', 404);
  }

  res.json({
    success: true,
    user: sanitizeUser(users[0])
  });
});

// Update user (admin or self)
const updateUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const { username, email, firstName, lastName, phoneNumber, bio } = req.body;

  // Check authorization
  if (!req.user.isAdmin && req.user.id !== parseInt(userId)) {
    throw new ApiError('Not authorized to update this user', 403);
  }

  // Validate inputs
  if (username) {
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      throw new ApiError(usernameValidation.message, 400);
    }

    // Check username uniqueness
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username.toLowerCase(), userId]
    );
    if (existingUsers.length > 0) {
      throw new ApiError('Username is already taken', 400);
    }
  }

  if (email) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new ApiError(emailValidation.message, 400);
    }

    // Check email uniqueness
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email.toLowerCase(), userId]
    );
    if (existingUsers.length > 0) {
      throw new ApiError('Email is already registered', 400);
    }
  }

  if (phoneNumber) {
    const phoneValidation = validatePhone(phoneNumber);
    if (!phoneValidation.isValid) {
      throw new ApiError(phoneValidation.message, 400);
    }
  }

  // Update user
  await db.query(`
    UPDATE users 
    SET 
      username = COALESCE(?, username),
      email = COALESCE(?, email),
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      phone_number = COALESCE(?, phone_number),
      bio = COALESCE(?, bio),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND is_active = true
  `, [
    username?.toLowerCase(),
    email?.toLowerCase(),
    firstName,
    lastName,
    phoneNumber,
    bio,
    userId
  ]);

  // Get updated user
  const [users] = await db.query(
    'SELECT * FROM users WHERE id = ? AND is_active = true',
    [userId]
  );

  if (!users[0]) {
    throw new ApiError('User not found', 404);
  }

  logger.info('User updated successfully', {
    userId,
    updatedBy: req.user.id
  });

  res.json({
    success: true,
    user: sanitizeUser(users[0])
  });
});

// Soft delete user (admin only)
const deleteUser = catchAsync(async (req, res) => {
  const userId = req.params.id;

  // Prevent deleting self
  if (req.user.id === parseInt(userId)) {
    throw new ApiError('Cannot delete your own account', 400);
  }

  // Soft delete user
  const [result] = await db.query(`
    UPDATE users 
    SET 
      is_active = false,
      deactivated_at = CURRENT_TIMESTAMP,
      deactivated_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND is_active = true
  `, [req.user.id, userId]);

  if (result.affectedRows === 0) {
    throw new ApiError('User not found', 404);
  }

  logger.info('User deleted successfully', {
    userId,
    deletedBy: req.user.id
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Get user profile
const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    throw new ApiError('User not found', 404);
  }
  res.json({ success: true, data: user });
});

// Update user profile
const updateProfile = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new ApiError('Email already in use', 400);
    }
  }

  user.name = name || user.name;
  user.email = email || user.email;

  const updatedUser = await user.save();
  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    }
  });
});

// Get user test history
const getTestHistory = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get total count
  const [countResult] = await db.query(
    'SELECT COUNT(*) as total FROM test_results WHERE user_id = ?',
    [req.user.id]
  );
  const total = countResult[0].total;

  // Get paginated results
  const [tests] = await db.query(`
    SELECT 
      tr.*,
      t.title as test_name,
      t.description,
      t.total_questions,
      t.duration
    FROM test_results tr
    JOIN tests t ON t.id = tr.test_id
    WHERE tr.user_id = ?
    ORDER BY tr.created_at DESC
    LIMIT ? OFFSET ?
  `, [req.user.id, limit, offset]);

  res.json({
    success: true,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    tests: tests.map(test => ({
      id: test.id,
      testName: test.test_name,
      description: test.description,
      score: test.score,
      totalQuestions: test.total_questions,
      duration: test.duration,
      timeTaken: test.time_taken,
      completedAt: test.created_at
    }))
  });
});

// Get specific test result
const getTestById = catchAsync(async (req, res) => {
  const [tests] = await db.query(`
    SELECT 
      tr.*,
      t.title as test_name,
      t.description,
      t.total_questions,
      t.duration,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'question_id', tq.question_id,
          'user_answer', tq.user_answer,
          'is_correct', tq.is_correct,
          'points', tq.points
        )
      ) as questions
    FROM test_results tr
    JOIN tests t ON t.id = tr.test_id
    LEFT JOIN test_questions tq ON tq.test_result_id = tr.id
    WHERE tr.id = ? AND tr.user_id = ?
    GROUP BY tr.id
  `, [req.params.id, req.user.id]);

  if (!tests[0]) {
    throw new ApiError('Test result not found', 404);
  }

  const test = tests[0];
  test.questions = JSON.parse(test.questions);

  res.json({
    success: true,
    test: {
      id: test.id,
      testName: test.test_name,
      description: test.description,
      score: test.score,
      totalQuestions: test.total_questions,
      duration: test.duration,
      timeTaken: test.time_taken,
      completedAt: test.created_at,
      questions: test.questions
    }
  });
});

// Get user settings
const getSettings = catchAsync(async (req, res) => {
  const [settings] = await db.query(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [req.user.id]
  );

  // Return default settings if none exist
  const userSettings = settings[0] || {
    email_notifications: true,
    dark_mode: false,
    show_progress: true,
    auto_save_answers: true,
    language: 'en',
    timezone: 'UTC'
  };

  res.json({
    success: true,
    settings: {
      emailNotifications: userSettings.email_notifications,
      darkMode: userSettings.dark_mode,
      showProgress: userSettings.show_progress,
      autoSaveAnswers: userSettings.auto_save_answers,
      language: userSettings.language,
      timezone: userSettings.timezone
    }
  });
});

// Update user settings
const updateSettings = catchAsync(async (req, res) => {
  const { setting, value } = req.body;

  // Validate setting name
  const validSettings = [
    'emailNotifications',
    'darkMode',
    'showProgress',
    'autoSaveAnswers',
    'language',
    'timezone'
  ];

  if (!validSettings.includes(setting)) {
    throw new ApiError('Invalid setting', 400);
  }

  // Convert camelCase to snake_case
  const dbSetting = setting.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

  // Validate value type
  const settingTypes = {
    email_notifications: 'boolean',
    dark_mode: 'boolean',
    show_progress: 'boolean',
    auto_save_answers: 'boolean',
    language: 'string',
    timezone: 'string'
  };

  if (typeof value !== settingTypes[dbSetting]) {
    throw new ApiError(`Invalid value type for ${setting}`, 400);
  }

  // Upsert settings
  await db.query(`
    INSERT INTO user_settings (
      user_id, 
      ${dbSetting}, 
      updated_at
    ) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE 
      ${dbSetting} = VALUES(${dbSetting}),
      updated_at = VALUES(updated_at)
  `, [req.user.id, value]);

  logger.info('User settings updated', {
    userId: req.user.id,
    setting,
    value
  });

  // Get updated settings
  const [settings] = await db.query(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [req.user.id]
  );

  res.json({
    success: true,
    settings: {
      emailNotifications: settings[0].email_notifications,
      darkMode: settings[0].dark_mode,
      showProgress: settings[0].show_progress,
      autoSaveAnswers: settings[0].auto_save_answers,
      language: settings[0].language,
      timezone: settings[0].timezone
    }
  });
});

// Get user performance statistics
const getPerformanceStats = catchAsync(async (req, res) => {
  const stats = await UserPerformance.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: '$category',
        averageScore: { $avg: '$score' },
        totalTests: { $sum: 1 },
        totalCorrect: { $sum: '$correctAnswers' },
        totalQuestions: { $sum: '$totalQuestions' },
        averageTime: { $avg: '$timeTaken' }
      }
    }
  ]);

  const overall = await UserPerformance.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score' },
        totalTests: { $sum: 1 },
        totalCorrect: { $sum: '$correctAnswers' },
        totalQuestions: { $sum: '$totalQuestions' },
        averageTime: { $avg: '$timeTaken' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      categoryStats: stats,
      overall: overall[0] || {
        averageScore: 0,
        totalTests: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        averageTime: 0
      }
    }
  });
});

// Get recent performance history
const getPerformanceHistory = catchAsync(async (req, res) => {
  const { limit = 10, category } = req.query;
  
  const query = { user: req.user._id };
  if (category) {
    query.category = category;
  }

  const history = await UserPerformance.find(query)
    .sort({ completedAt: -1 })
    .limit(parseInt(limit))
    .populate('testId', 'title')
    .select('-answers');

  res.json({ success: true, data: history });
});

// Delete user account
const deleteAccount = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Delete user's performance records
  await UserPerformance.deleteMany({ user: req.user.id });
  
  // Delete user
  await user.remove();

  res.json({ 
    success: true, 
    message: 'Account deleted successfully' 
  });
});

// Get user performance details for a specific test
const getTestPerformance = catchAsync(async (req, res) => {
  const { testId } = req.params;
  
  const performance = await UserPerformance.findOne({
    user: req.user._id,
    testId
  }).populate('testId', 'title category difficulty');

  if (!performance) {
    throw new ApiError('Performance record not found', 404);
  }

  res.json({ success: true, data: performance });
});

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
  getPerformanceStats,
  getPerformanceHistory,
  deleteAccount,
  getTestPerformance
};