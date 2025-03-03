const db = require('../config/db');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

// Utility function for error handling
const handleError = (error, message, statusCode = 500) => {
  console.error(message, error);
  return { message, error: error.message, statusCode };
};

// Get Users (Admin only)
exports.getUsers = asyncHandler(async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT 
        id, 
        username, 
        email, 
        is_admin, 
        created_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    const processedUsers = users.map(user => ({
      ...user,
      is_admin: Boolean(user.is_admin)
    }));

    return apiResponse.success(res, 'Users retrieved successfully', processedUsers);
  } catch (error) {
    return apiResponse.error(res, 'Failed to retrieve users', error);
  }
});

// Analytics and Reports
const getReportData = async (req, type) => {
  const { range = 'month' } = req.query;
  const now = new Date();
  let startDate;

  switch (range) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  let data;
  if (type === 'performance') {
    const [tests] = await db.query(
      `SELECT 
        DATE(created_at) as date,
        AVG(score / total_questions * 100) as average_score,
        COUNT(*) as test_count
      FROM user_performance
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date`,
      [startDate]
    );

    data = {
      labels: tests.map(t => t.date),
      averageScores: tests.map(t => Number(t.average_score).toFixed(2)),
      testCounts: tests.map(t => t.test_count)
    };
  } else {
    // Default to user statistics
    const [newUsers] = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date`,
      [startDate]
    );

    const [activeUsers] = await db.query(
      `SELECT 
        DATE(up.created_at) as date,
        COUNT(DISTINCT up.username) as count
      FROM user_performance up
      WHERE up.created_at >= ?
      GROUP BY DATE(up.created_at)
      ORDER BY date`,
      [startDate]
    );

    data = {
      labels: newUsers.map(u => u.date),
      newUsers: newUsers.map(u => u.count),
      activeUsers: activeUsers.map(u => u.count)
    };
  }

  return data;
};

// Get Reports (Admin only)
exports.getReports = asyncHandler(async (req, res) => {
  try {
    const { type = 'users' } = req.query;
    const data = await getReportData(req, type);
    
    return apiResponse.success(res, 'Reports retrieved successfully', data);
  } catch (error) {
    return apiResponse.error(res, 'Failed to retrieve reports', error);
  }
});

// Export Report (Admin only)
exports.exportReport = asyncHandler(async (req, res) => {
  try {
    const { type = 'users', range = 'month', format = 'csv' } = req.query;
    const data = await getReportData(req, type);

    // Handle different export formats
    if (format === 'pdf') {
      // For PDF, we'll send JSON that the frontend will convert to PDF
      return apiResponse.success(res, 'Report data for PDF export', data);
    } else {
      // Default to CSV/Excel format
      const csvStringifier = createCsvStringifier({
        header: type === 'performance' 
          ? [
              { id: 'date', title: 'Date' },
              { id: 'averageScore', title: 'Average Score' },
              { id: 'testCount', title: 'Number of Tests' }
            ]
          : [
              { id: 'date', title: 'Date' },
              { id: 'newUsers', title: 'New Users' },
              { id: 'activeUsers', title: 'Active Users' }
            ]
      });

      const records = data.labels.map((date, index) => ({
        date,
        ...(type === 'performance' 
          ? {
              averageScore: data.averageScores[index],
              testCount: data.testCounts[index]
            }
          : {
              newUsers: data.newUsers[index],
              activeUsers: data.activeUsers[index]
            }
        )
      }));

      const csvString = csvStringifier.stringifyRecords(records);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${range}.csv`);
      res.send(csvString);
    }
  } catch (error) {
    return apiResponse.error(res, 'Failed to export report', error);
  }
});

// Additional User Management Methods (Optional)
exports.getUserById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await db.query(
      `SELECT 
        id, 
        username, 
        email, 
        first_name,
        last_name,
        is_admin, 
        created_at 
      FROM users 
      WHERE id = ?`,
      [id]
    );

    if (!users || users.length === 0) {
      return apiResponse.notFound(res, 'User not found');
    }

    return apiResponse.success(res, 'User retrieved successfully', users[0]);
  } catch (error) {
    return apiResponse.error(res, 'Failed to retrieve user', error);
  }
});

exports.createUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, is_admin } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return apiResponse.badRequest(res, 'Username, email, and password are required');
    }

    // Check if username or email already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return apiResponse.badRequest(res, 'Username or email already exists');
    }

    // Hash the password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new user
    const [result] = await db.query(
      `INSERT INTO users (
        username, 
        email, 
        password, 
        first_name, 
        last_name, 
        is_admin, 
        is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, first_name, last_name, is_admin ? 1 : 0, 1]
    );

    if (!result.insertId) {
      return apiResponse.error(res, 'Failed to create user');
    }

    return apiResponse.success(res, 'User created successfully', { id: result.insertId });
  } catch (error) {
    console.error('Error creating user:', error);
    return apiResponse.error(res, 'Failed to create user', error);
  }
});

exports.updateUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { email, first_name, last_name, is_admin } = req.body;

    // Validate required fields
    if (!email) {
      return apiResponse.badRequest(res, 'Email is required');
    }

    // Check if email already exists for another user
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );

    if (existingUsers.length > 0) {
      return apiResponse.badRequest(res, 'Email already exists for another user');
    }

    // Update the user
    const [result] = await db.query(
      `UPDATE users SET 
        email = ?, 
        first_name = ?, 
        last_name = ?, 
        is_admin = ? 
      WHERE id = ?`,
      [email, first_name, last_name, is_admin ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return apiResponse.notFound(res, 'User not found');
    }

    return apiResponse.success(res, 'User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
    return apiResponse.error(res, 'Failed to update user', error);
  }
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    
    // Get the username first (needed for foreign key references)
    const [userRows] = await connection.query('SELECT username FROM users WHERE id = ?', [id]);
    
    if (userRows.length === 0) {
      await connection.rollback();
      return apiResponse.notFound(res, 'User not found');
    }
    
    const username = userRows[0].username;

    // Get performance IDs associated with this user
    const [performanceRows] = await connection.query(
      'SELECT id FROM user_performance WHERE username = ?', 
      [username]
    );
    
    // Delete user_responses records linked to user's performances
    if (performanceRows.length > 0) {
      const performanceIds = performanceRows.map(row => row.id);
      await connection.query(
        'DELETE FROM user_responses WHERE performance_id IN (?)', 
        [performanceIds]
      );
    }
    
    // Delete user_performance records
    await connection.query('DELETE FROM user_performance WHERE username = ?', [username]);
    
    // Finally delete the user
    const [result] = await connection.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return apiResponse.notFound(res, 'User not found');
    }

    await connection.commit();
    return apiResponse.success(res, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    await connection.rollback();
    return apiResponse.error(res, 'Failed to delete user', error);
  } finally {
    connection.release();
  }
});

// Get Test Statistics (Admin only)
exports.getTestStats = asyncHandler(async (req, res) => {
  try {
    // Get overall test statistics
    const [overallStats] = await db.query(`
      SELECT 
        COUNT(*) as total_tests,
        AVG(score) as average_score,
        MAX(score) as highest_score,
        SUM(total_questions) as total_questions_attempted,
        AVG(time_taken) as average_time
      FROM test_results
    `);
    
    // Get subject-wise statistics
    const [subjectStats] = await db.query(`
      SELECT 
        s.name as subject_name,
        COUNT(tr.id) as tests_taken,
        AVG(tr.score) as average_score
      FROM test_results tr
      JOIN subjects s ON tr.subject_id = s.id
      GROUP BY tr.subject_id
      ORDER BY average_score DESC
    `);
    
    // Get user statistics - get total users from users table
    const [totalUsersResult] = await db.query(`
      SELECT COUNT(*) as total_users FROM users
    `);
    
    // Get average tests per user
    const [testUserStats] = await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as users_with_tests,
        COUNT(*) / NULLIF(COUNT(DISTINCT user_id), 0) as avg_tests_per_user
      FROM test_results
    `);
    
    // Combine user statistics
    const userStats = {
      total_users: totalUsersResult[0].total_users,
      users_with_tests: testUserStats[0].users_with_tests || 0,
      avg_tests_per_user: testUserStats[0].avg_tests_per_user || 0
    };
    
    return apiResponse.success(res, 'Test statistics retrieved successfully', {
      overall: overallStats[0],
      subjects: subjectStats,
      users: userStats
    });
  } catch (error) {
    return apiResponse.error(res, 'Failed to retrieve test statistics', error);
  }
});

// Export Users (Admin only)
exports.exportUsers = asyncHandler(async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    // Get users data
    const [users] = await db.query(`
      SELECT 
        id, 
        username, 
        email, 
        is_admin, 
        created_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    const processedUsers = users.map(user => ({
      ...user,
      is_admin: Boolean(user.is_admin),
      created_at: new Date(user.created_at).toLocaleDateString()
    }));

    if (format === 'json') {
      // For JSON format (used by frontend for PDF generation)
      return apiResponse.success(res, 'Users data for export', processedUsers);
    } else {
      // Default to CSV format
      const csvStringifier = createCsvStringifier({
        header: [
          { id: 'id', title: 'ID' },
          { id: 'username', title: 'Username' },
          { id: 'email', title: 'Email' },
          { id: 'is_admin', title: 'Is Admin' },
          { id: 'created_at', title: 'Created At' }
        ]
      });

      const csvString = csvStringifier.stringifyRecords(processedUsers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.send(csvString);
    }
  } catch (error) {
    return apiResponse.error(res, 'Failed to export users', error);
  }
});

// Export Test Statistics (Admin only)
exports.exportTestStats = asyncHandler(async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    // Get subject-wise statistics
    const [subjectStats] = await db.query(`
      SELECT 
        s.name as subject_name,
        COUNT(tr.id) as tests_taken,
        AVG(tr.score) as average_score
      FROM test_results tr
      JOIN subjects s ON tr.subject_id = s.id
      GROUP BY tr.subject_id
      ORDER BY average_score DESC
    `);

    // Process data for export
    const processedStats = subjectStats.map(subject => ({
      subject_name: subject.subject_name,
      tests_taken: subject.tests_taken,
      average_score: `${subject.average_score.toFixed(1)}%`
    }));

    if (format === 'json') {
      // For JSON format (used by frontend for PDF generation)
      return apiResponse.success(res, 'Test statistics for export', processedStats);
    } else {
      // Default to CSV format
      const csvStringifier = createCsvStringifier({
        header: [
          { id: 'subject_name', title: 'Subject' },
          { id: 'tests_taken', title: 'Tests Taken' },
          { id: 'average_score', title: 'Average Score' }
        ]
      });

      const csvString = csvStringifier.stringifyRecords(processedStats);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=test-statistics.csv');
      res.send(csvString);
    }
  } catch (error) {
    return apiResponse.error(res, 'Failed to export test statistics', error);
  }
});