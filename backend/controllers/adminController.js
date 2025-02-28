const db = require('../config/db');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ message, error: error.message });
};

// Analytics and Reports
const getReportData = async (req, type) => {
  const { range } = req.query;
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
      averageScores: tests.map(t => t.average_score.toFixed(2)),
      testCounts: tests.map(t => t.test_count)
    };
  } else if (type === 'users') {
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

const getReports = async (req, res) => {
  try {
    const { type } = req.query;
    const data = await getReportData(req, type);
    res.json(data);
  } catch (error) {
    handleError(res, error, 'Error fetching reports');
  }
};

exports.getReports = getReports;

exports.exportReport = async (req, res) => {
  try {
    const { type } = req.query;
    const data = await getReportData(req, type);

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
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${req.query.range}.csv`);
    res.send(csvString);
  } catch (err) {
    handleError(res, err, 'Report export error');
  }
};

// User Management
const getUserData = async (req, id) => {
  const [users] = await db.query(
    `SELECT 
      u.username,
      u.email,
      u.is_admin,
      u.is_verified,
      u.created_at,
      COALESCE(up.test_count, 0) as test_count,
      COALESCE(up.avg_score, 0) as avg_score
    FROM users u
    LEFT JOIN (
      SELECT 
        username,
        COUNT(*) as test_count,
        AVG(score) as avg_score
      FROM user_performance
      GROUP BY username
    ) up ON u.username = up.username
    ${id ? `WHERE u.username = ?` : `ORDER BY u.created_at DESC`}`,
    [id]
  );

  return users;
};

const getAllUsers = async (req, res) => {
  try {
    const users = await getUserData(req);
    res.json({
      success: true,
      data: users.map(user => ({
        ...user,
        avg_score: Number(user.avg_score || 0).toFixed(1)
      }))
    });
  } catch (error) {
    handleError(res, error, 'Error fetching users');
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await getUserData(req, id);

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...users[0],
        avg_score: Number(users[0].avg_score || 0).toFixed(1)
      }
    });
  } catch (error) {
    handleError(res, error, 'Error fetching user');
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_admin, is_verified } = req.body;

    await db.query(
      'UPDATE users SET is_admin = ?, is_verified = ? WHERE username = ?',
      [is_admin, is_verified, id]
    );

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    handleError(res, error, 'Error updating user');
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Delete user's performance records
      await connection.query('DELETE FROM user_performance WHERE username = ?', [id]);
      
      // Delete user's responses
      await connection.query(
        'DELETE ur FROM user_responses ur JOIN user_performance up ON ur.performance_id = up.id WHERE up.username = ?',
        [id]
      );
      
      // Delete the user
      await connection.query('DELETE FROM users WHERE username = ?', [id]);

      await connection.commit();
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    handleError(res, error, 'Error deleting user');
  }
};

exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
