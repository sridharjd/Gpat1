const db = require('../config/db').pool;
const logger = require('../config/logger');
const { ApiError } = require('../utils/errors');
const { catchAsync } = require('../utils/errors');
const { validateUser, validateReport } = require('../utils/validation');
const cache = require('../config/cache');
const bcrypt = require('bcryptjs');
const { createObjectCsvStringifier } = require('csv-writer');
const { generatePDF } = require('../utils/pdfGenerator');

// Utility function for error handling
const handleError = (error, message, statusCode = 500) => {
  console.error(message, error);
  return { message, error: error.message, statusCode };
};

// Get Users with pagination and caching
const getUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search;

  // Try cache first
  const cacheKey = `admin:users:${page}:${limit}:${search || ''}`;
  const cachedUsers = await cache.get(cacheKey);

  if (cachedUsers) {
    return res.json(JSON.parse(cachedUsers));
  }

  let query = `
    SELECT 
      u.id,
      u.username,
      u.email,
      u.first_name,
      u.last_name,
      u.is_admin,
      u.is_verified,
      u.is_active,
      u.created_at,
      u.last_login,
      COUNT(DISTINCT tr.id) as total_tests,
      ROUND(AVG(tr.score), 2) as avg_score
    FROM users u
    LEFT JOIN test_results tr ON tr.user_id = u.id
  `;

  const params = [];

  if (search) {
    query += ` WHERE (
      u.username LIKE ? OR 
      u.email LIKE ? OR 
      u.first_name LIKE ? OR 
      u.last_name LIKE ?
    )`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  query += ' GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  // Get total count
  const [countResult] = await db.query(
    'SELECT COUNT(*) as total FROM users' + (search ? ' WHERE username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?' : ''),
    search ? [search, search, search, search] : []
  );

  const [users] = await db.query(query, params);

  const result = {
    success: true,
    pagination: {
      page,
      limit,
      total: countResult[0].total,
      pages: Math.ceil(countResult[0].total / limit)
    },
    users: users.map(user => ({
      ...user,
      is_admin: Boolean(user.is_admin),
      is_verified: Boolean(user.is_verified),
      is_active: Boolean(user.is_active)
    }))
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, JSON.stringify(result), 300);

  res.json(result);
});

// Get user by ID with caching
const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Try cache first
  const cacheKey = `admin:user:${id}`;
  const cachedUser = await cache.get(cacheKey);

  if (cachedUser) {
    return res.json(JSON.parse(cachedUser));
  }

  const [users] = await db.query(`
    SELECT 
      u.*,
      COUNT(DISTINCT tr.id) as total_tests,
      ROUND(AVG(tr.score), 2) as avg_score,
      MAX(tr.score) as highest_score,
      SUM(tr.time_taken) as total_time,
      (
        SELECT COUNT(*)
        FROM test_results
        WHERE user_id = u.id
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ) as recent_tests
    FROM users u
    LEFT JOIN test_results tr ON tr.user_id = u.id
    WHERE u.id = ?
    GROUP BY u.id
  `, [id]);

  if (!users[0]) {
    throw new ApiError('User not found', 404);
  }

  const user = users[0];
  delete user.password;

  const result = {
    success: true,
    user: {
      ...user,
      is_admin: Boolean(user.is_admin),
      is_verified: Boolean(user.is_verified),
      is_active: Boolean(user.is_active)
    }
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, JSON.stringify(result), 300);

  res.json(result);
});

// Create user with validation
const createUser = catchAsync(async (req, res) => {
  const userData = req.body;

  // Validate user data
  const validation = validateUser(userData);
  if (!validation.isValid) {
    throw new ApiError(validation.message, 400);
  }

  // Check unique constraints
  const [existing] = await db.query(
    'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
    [userData.username, userData.email]
  );

  if (existing.length > 0) {
    const existingUser = existing[0];
    if (existingUser.email === userData.email) {
      throw new ApiError('Email already exists', 400);
    }
    if (existingUser.username === userData.username) {
      throw new ApiError('Username already exists', 400);
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  // Create user
  const [result] = await db.query(`
    INSERT INTO users (
      username,
      email,
      password,
      first_name,
      last_name,
      is_admin,
      is_verified,
      created_by,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [
    userData.username.toLowerCase(),
    userData.email.toLowerCase(),
    hashedPassword,
    userData.firstName,
    userData.lastName,
    Boolean(userData.isAdmin),
    Boolean(userData.isVerified),
    req.user.id
  ]);

  // Clear users cache
  await cache.del('admin:users:*');

  logger.info('User created successfully', {
    userId: result.insertId,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    userId: result.insertId
  });
});

// Get analytics data with caching
const getAnalytics = catchAsync(async (req, res) => {
  const { range = '30d', type = 'all' } = req.query;

  // Try cache first
  const cacheKey = `admin:analytics:${range}:${type}`;
  const cachedData = await cache.get(cacheKey);

  if (cachedData) {
    return res.json(JSON.parse(cachedData));
  }

  const rangeMap = {
    '7d': 'INTERVAL 7 DAY',
    '30d': 'INTERVAL 30 DAY',
    '90d': 'INTERVAL 90 DAY',
    '1y': 'INTERVAL 1 YEAR'
  };

  const timeRange = rangeMap[range] || 'INTERVAL 30 DAY';
  const queries = [];

  if (type === 'all' || type === 'users') {
    queries.push(db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        COUNT(DISTINCT CASE WHEN last_login >= DATE_SUB(NOW(), ${timeRange}) THEN id END) as active_users
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), ${timeRange})
      GROUP BY DATE(created_at)
      ORDER BY date
    `));
  }

  if (type === 'all' || type === 'tests') {
    queries.push(db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_tests,
        ROUND(AVG(score), 2) as avg_score,
        COUNT(DISTINCT user_id) as unique_users
      FROM test_results
      WHERE created_at >= DATE_SUB(NOW(), ${timeRange})
      GROUP BY DATE(created_at)
      ORDER BY date
    `));
  }

  if (type === 'all' || type === 'subjects') {
    queries.push(db.query(`
      SELECT 
        s.name as subject_name,
        COUNT(tr.id) as total_tests,
        ROUND(AVG(tr.score), 2) as avg_score,
        COUNT(DISTINCT tr.user_id) as unique_users
      FROM subjects s
      LEFT JOIN test_results tr ON tr.subject_id = s.id
      WHERE tr.created_at >= DATE_SUB(NOW(), ${timeRange})
      GROUP BY s.id
      ORDER BY total_tests DESC
    `));
  }

  const results = await Promise.all(queries);
  const analytics = {};

  if (type === 'all' || type === 'users') {
    analytics.users = results[0][0];
  }

  if (type === 'all' || type === 'tests') {
    analytics.tests = results[type === 'all' ? 1 : 0][0];
  }

  if (type === 'all' || type === 'subjects') {
    analytics.subjects = results[type === 'all' ? 2 : 0][0];
  }

  const result = {
    success: true,
    range,
    analytics
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, JSON.stringify(result), 300);

  res.json(result);
});

// Export report with validation
const exportReport = catchAsync(async (req, res) => {
  const { type = 'users', range = '30d', format = 'csv' } = req.query;

  // Validate report parameters
  const validation = validateReport({ type, range, format });
  if (!validation.isValid) {
    throw new ApiError(validation.message, 400);
  }

  // Get analytics data
  const { analytics } = await getAnalytics(req, res);

  if (format === 'csv') {
    const csvStringifier = createObjectCsvStringifier({
      header: getReportHeaders(type)
    });

    const records = formatReportData(type, analytics[type]);
    const csvString = csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${range}.csv`);
    return res.send(csvString);
  }

  if (format === 'pdf') {
    const pdfBuffer = await generatePDF(type, analytics[type]);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${range}.pdf`);
    return res.send(pdfBuffer);
  }

  throw new ApiError('Unsupported format', 400);
});

// Helper functions for report generation
const getReportHeaders = (type) => {
  const headers = {
    users: [
      { id: 'date', title: 'Date' },
      { id: 'newUsers', title: 'New Users' },
      { id: 'activeUsers', title: 'Active Users' }
    ],
    tests: [
      { id: 'date', title: 'Date' },
      { id: 'totalTests', title: 'Total Tests' },
      { id: 'avgScore', title: 'Average Score' },
      { id: 'uniqueUsers', title: 'Unique Users' }
    ],
    subjects: [
      { id: 'subject', title: 'Subject' },
      { id: 'totalTests', title: 'Total Tests' },
      { id: 'avgScore', title: 'Average Score' },
      { id: 'uniqueUsers', title: 'Unique Users' }
    ]
  };

  return headers[type] || headers.users;
};

const formatReportData = (type, data) => {
  if (!data) return [];

  switch (type) {
    case 'users':
      return data.map(d => ({
        date: d.date,
        newUsers: d.new_users,
        activeUsers: d.active_users
      }));
    case 'tests':
      return data.map(d => ({
        date: d.date,
        totalTests: d.total_tests,
        avgScore: d.avg_score,
        uniqueUsers: d.unique_users
      }));
    case 'subjects':
      return data.map(d => ({
        subject: d.subject_name,
        totalTests: d.total_tests,
        avgScore: d.avg_score,
        uniqueUsers: d.unique_users
      }));
    default:
      return [];
  }
};

// Get dashboard overview with caching
const getDashboardOverview = catchAsync(async (req, res) => {
  const cacheKey = 'admin:dashboard:overview';
  const cachedData = await cache.get(cacheKey);

  if (cachedData) {
    return res.json(JSON.parse(cachedData));
  }

  // Get user statistics
  const [userStats] = await db.query(`
    SELECT
      COUNT(*) as total_users,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d,
      COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_users_7d,
      COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users
    FROM users
  `);

  // Get test statistics
  const [testStats] = await db.query(`
    SELECT
      COUNT(*) as total_tests,
      COUNT(DISTINCT user_id) as unique_test_takers,
      ROUND(AVG(score), 2) as avg_score,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as tests_30d
    FROM test_results
  `);

  // Get subject statistics
  const [subjectStats] = await db.query(`
    SELECT
      COUNT(*) as total_subjects,
      SUM(
        CASE WHEN EXISTS (
          SELECT 1 FROM test_results tr 
          WHERE tr.subject_id = s.id 
          AND tr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ) THEN 1 ELSE 0 END
      ) as active_subjects
    FROM subjects s
  `);

  // Get question statistics
  const [questionStats] = await db.query(`
    SELECT
      COUNT(*) as total_questions,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_questions,
      COUNT(DISTINCT subject_id) as subjects_with_questions
    FROM questions
  `);

  // Get recent activity
  const [recentActivity] = await db.query(`
    SELECT
      'test_completion' as activity_type,
      u.username,
      tr.score,
      s.name as subject_name,
      tr.created_at
    FROM test_results tr
    JOIN users u ON tr.user_id = u.id
    LEFT JOIN subjects s ON tr.subject_id = s.id
    WHERE tr.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ORDER BY tr.created_at DESC
    LIMIT 10
  `);

  const result = {
    success: true,
    dashboard: {
      users: {
        total: userStats[0].total_users,
        newLast30Days: userStats[0].new_users_30d,
        activeLast7Days: userStats[0].active_users_7d,
        verifiedCount: userStats[0].verified_users
      },
      tests: {
        total: testStats[0].total_tests,
        uniqueTakers: testStats[0].unique_test_takers,
        averageScore: testStats[0].avg_score,
        last30Days: testStats[0].tests_30d
      },
      subjects: {
        total: subjectStats[0].total_subjects,
        active: subjectStats[0].active_subjects
      },
      questions: {
        total: questionStats[0].total_questions,
        active: questionStats[0].active_questions,
        subjectsWithQuestions: questionStats[0].subjects_with_questions
      },
      recentActivity: recentActivity.map(activity => ({
        type: activity.activity_type,
        username: activity.username,
        score: activity.score,
        subjectName: activity.subject_name,
        timestamp: activity.created_at
      }))
    }
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, JSON.stringify(result), 300);

  res.json(result);
});

// Get performance analytics with caching
const getPerformanceAnalytics = catchAsync(async (req, res) => {
  const { range = '30d', groupBy = 'day' } = req.query;

  const cacheKey = `admin:performance:${range}:${groupBy}`;
  const cachedData = await cache.get(cacheKey);

  if (cachedData) {
    return res.json(JSON.parse(cachedData));
  }

  const rangeMap = {
    '7d': 'INTERVAL 7 DAY',
    '30d': 'INTERVAL 30 DAY',
    '90d': 'INTERVAL 90 DAY',
    '1y': 'INTERVAL 1 YEAR'
  };

  const groupByMap = {
    day: 'DATE(tr.created_at)',
    week: 'YEARWEEK(tr.created_at)',
    month: 'DATE_FORMAT(tr.created_at, "%Y-%m")'
  };

  const timeRange = rangeMap[range] || 'INTERVAL 30 DAY';
  const timeGroup = groupByMap[groupBy] || 'DATE(tr.created_at)';

  // Get overall performance trend
  const [performanceTrend] = await db.query(`
    SELECT
      ${timeGroup} as time_period,
      COUNT(*) as total_tests,
      COUNT(DISTINCT tr.user_id) as unique_users,
      ROUND(AVG(tr.score), 2) as avg_score,
      ROUND(MIN(tr.score), 2) as min_score,
      ROUND(MAX(tr.score), 2) as max_score,
      ROUND(AVG(tr.time_taken), 2) as avg_time
    FROM test_results tr
    WHERE tr.created_at >= DATE_SUB(NOW(), ${timeRange})
    GROUP BY ${timeGroup}
    ORDER BY time_period
  `);

  // Get subject-wise performance
  const [subjectPerformance] = await db.query(`
    SELECT
      s.name as subject_name,
      COUNT(tr.id) as total_tests,
      COUNT(DISTINCT tr.user_id) as unique_users,
      ROUND(AVG(tr.score), 2) as avg_score,
      ROUND(MIN(tr.score), 2) as min_score,
      ROUND(MAX(tr.score), 2) as max_score,
      ROUND(AVG(tr.time_taken), 2) as avg_time
    FROM subjects s
    LEFT JOIN test_results tr ON tr.subject_id = s.id
    WHERE tr.created_at >= DATE_SUB(NOW(), ${timeRange})
    GROUP BY s.id
    ORDER BY avg_score DESC
  `);

  // Get difficulty-wise performance
  const [difficultyPerformance] = await db.query(`
    SELECT
      q.difficulty_level,
      COUNT(tr.id) as total_tests,
      COUNT(DISTINCT tr.user_id) as unique_users,
      ROUND(AVG(tr.score), 2) as avg_score
    FROM questions q
    JOIN test_answers ta ON q.id = ta.question_id
    JOIN test_results tr ON ta.test_id = tr.id
    WHERE tr.created_at >= DATE_SUB(NOW(), ${timeRange})
    GROUP BY q.difficulty_level
    ORDER BY q.difficulty_level
  `);

  const result = {
    success: true,
    range,
    groupBy,
    performance: {
      trend: performanceTrend.map(p => ({
        period: p.time_period,
        totalTests: p.total_tests,
        uniqueUsers: p.unique_users,
        avgScore: p.avg_score,
        minScore: p.min_score,
        maxScore: p.max_score,
        avgTime: p.avg_time
      })),
      bySubject: subjectPerformance.map(s => ({
        subject: s.subject_name,
        totalTests: s.total_tests,
        uniqueUsers: s.unique_users,
        avgScore: s.avg_score,
        minScore: s.min_score,
        maxScore: s.max_score,
        avgTime: s.avg_time
      })),
      byDifficulty: difficultyPerformance.map(d => ({
        level: d.difficulty_level,
        totalTests: d.total_tests,
        uniqueUsers: d.unique_users,
        avgScore: d.avg_score
      }))
    }
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, JSON.stringify(result), 300);

  res.json(result);
});

// Get subject management data with caching
const getSubjects = catchAsync(async (req, res) => {
  const { active = true } = req.query;
  
  const cacheKey = `admin:subjects:${active}`;
  const cachedData = await cache.get(cacheKey);

  if (cachedData) {
    return res.json(JSON.parse(cachedData));
  }

  const [subjects] = await db.query(`
    SELECT
      s.*,
      COUNT(DISTINCT q.id) as question_count,
      COUNT(DISTINCT tr.id) as test_count,
      COUNT(DISTINCT tr.user_id) as unique_users,
      ROUND(AVG(tr.score), 2) as avg_score
    FROM subjects s
    LEFT JOIN questions q ON q.subject_id = s.id AND q.is_active = true
    LEFT JOIN test_results tr ON tr.subject_id = s.id
    WHERE s.is_active = ?
    GROUP BY s.id
    ORDER BY s.name
  `, [active]);

  // Get topic distribution for each subject
  const subjectsWithTopics = await Promise.all(
    subjects.map(async subject => {
      const [topics] = await db.query(`
        SELECT
          topic,
          COUNT(*) as question_count
        FROM questions
        WHERE subject_id = ? AND is_active = true
        GROUP BY topic
        ORDER BY question_count DESC
      `, [subject.id]);

      return {
        ...subject,
        topics: topics.map(t => ({
          name: t.topic,
          questionCount: t.question_count
        }))
      };
    })
  );

  const result = {
    success: true,
    subjects: subjectsWithTopics.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      isActive: Boolean(subject.is_active),
      createdAt: subject.created_at,
      stats: {
        questionCount: subject.question_count,
        testCount: subject.test_count,
        uniqueUsers: subject.unique_users,
        avgScore: subject.avg_score
      },
      topics: subject.topics
    }))
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, JSON.stringify(result), 300);

  res.json(result);
});

// Create or update subject
const manageSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const subjectData = req.body;

  // Validate subject data
  const validation = validateSubject(subjectData);
  if (!validation.isValid) {
    throw new ApiError(validation.message, 400);
  }

  let result;
  if (id) {
    // Update existing subject
    [result] = await db.query(`
      UPDATE subjects
      SET
        name = ?,
        code = ?,
        description = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?
      WHERE id = ?
    `, [
      subjectData.name,
      subjectData.code,
      subjectData.description,
      Boolean(subjectData.isActive),
      req.user.id,
      id
    ]);

    if (result.affectedRows === 0) {
      throw new ApiError('Subject not found', 404);
    }
  } else {
    // Create new subject
    [result] = await db.query(`
      INSERT INTO subjects (
        name,
        code,
        description,
        is_active,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      subjectData.name,
      subjectData.code,
      subjectData.description,
      Boolean(subjectData.isActive),
      req.user.id
    ]);
  }

  // Clear subjects cache
  await cache.del('admin:subjects:*');

  logger.info(`Subject ${id ? 'updated' : 'created'} successfully`, {
    subjectId: id || result.insertId,
    updatedBy: req.user.id
  });

  res.status(id ? 200 : 201).json({
    success: true,
    message: `Subject ${id ? 'updated' : 'created'} successfully`,
    subjectId: id || result.insertId
  });
});

// Get test statistics
const getTestStats = catchAsync(async (req, res) => {
  const [testStats] = await db.query(`
    SELECT
      COUNT(*) as total_tests,
      ROUND(AVG(score), 2) as avg_score,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(CASE WHEN score >= 70 THEN 1 END) as passing_tests,
      ROUND(AVG(time_taken), 2) as avg_time
    FROM test_results
  `);

  const [subjectStats] = await db.query(`
    SELECT
      s.name as subject_name,
      COUNT(tr.id) as tests_taken,
      ROUND(AVG(tr.score), 2) as average_score,
      COUNT(CASE WHEN tr.score >= 70 THEN 1 END) / COUNT(*) * 100 as pass_rate,
      ROUND(AVG(tr.time_taken), 2) as average_time
    FROM subjects s
    LEFT JOIN test_results tr ON tr.subject_id = s.id
    GROUP BY s.id
    ORDER BY tests_taken DESC
  `);

  res.json({
    success: true,
    data: {
      overall: testStats[0],
      subjects: subjectStats
    }
  });
});

// Get user statistics
const getUserStats = catchAsync(async (req, res) => {
  const [userStats] = await db.query(`
    SELECT
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d,
      COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_users_7d
    FROM users
  `);

  const [userActivity] = await db.query(`
    SELECT
      u.id,
      u.username,
      COUNT(tr.id) as tests_taken,
      ROUND(AVG(tr.score), 2) as avg_score
    FROM users u
    LEFT JOIN test_results tr ON tr.user_id = u.id
    GROUP BY u.id
    ORDER BY tests_taken DESC
    LIMIT 10
  `);

  res.json({
    success: true,
    data: {
      stats: userStats[0],
      topUsers: userActivity
    }
  });
});

// Get performance statistics
const getPerformanceStats = catchAsync(async (req, res) => {
  const [overallStats] = await db.query(`
    SELECT
      ROUND(AVG(score), 2) as avg_score,
      ROUND(MIN(score), 2) as min_score,
      ROUND(MAX(score), 2) as max_score,
      ROUND(AVG(time_taken), 2) as avg_time,
      COUNT(CASE WHEN score >= 70 THEN 1 END) / COUNT(*) * 100 as overall_pass_rate
    FROM test_results
  `);

  const [trendStats] = await db.query(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as total_tests,
      ROUND(AVG(score), 2) as avg_score
    FROM test_results
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date
  `);

  res.json({
    success: true,
    data: {
      overall: overallStats[0],
      trend: trendStats
    }
  });
});

// Get dashboard statistics
const getDashboardStats = catchAsync(async (req, res) => {
  const [overview] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM test_results) as total_tests,
      (SELECT ROUND(AVG(score), 2) FROM test_results) as avg_score,
      (SELECT COUNT(*) FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as active_users
  `);

  const [recentTests] = await db.query(`
    SELECT
      tr.id,
      u.username,
      s.name as subject_name,
      tr.score,
      tr.created_at
    FROM test_results tr
    JOIN users u ON tr.user_id = u.id
    LEFT JOIN subjects s ON tr.subject_id = s.id
    ORDER BY tr.created_at DESC
    LIMIT 5
  `);

  res.json({
    success: true,
    data: {
      overview: overview[0],
      recentTests
    }
  });
});

// Update user active status
const updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw new ApiError('isActive must be a boolean value', 400);
  }

  // Prevent deactivating self
  if (req.user.id === parseInt(id) && !isActive) {
    throw new ApiError('Cannot deactivate your own account', 400);
  }

  const [result] = await db.query(
    `UPDATE users 
     SET is_active = ?,
         updated_at = CURRENT_TIMESTAMP,
         updated_by = ?
     WHERE id = ?`,
    [isActive, req.user.id, id]
  );

  if (result.affectedRows === 0) {
    throw new ApiError('User not found', 404);
  }

  // Clear user cache
  await cache.del(`admin:user:${id}`);
  await cache.del('admin:users:*');

  logger.info('User status updated successfully', {
    userId: id,
    isActive,
    updatedBy: req.user.id
  });

  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
  });
});

module.exports = {
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
};