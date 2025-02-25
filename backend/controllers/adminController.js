const db = require('../config/db');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

// Analytics and Reports
exports.getReports = async (req, res) => {
  try {
    const { type, range } = req.query;
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

    res.json(data);
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ message: 'Error generating report' });
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { type, range } = req.query;
    const data = await exports.getReports(req, res);

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
  } catch (err) {
    console.error('Report export error:', err);
    res.status(500).json({ message: 'Error exporting report' });
  }
};

// User Management
exports.getAllUsers = async (req, res) => {
  try {
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
      ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      data: users.map(user => ({
        ...user,
        avg_score: Number(user.avg_score || 0).toFixed(1)
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users. Please try again later.'
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await db.query(
      `SELECT 
        u.*,
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
      WHERE u.username = ?`,
      [id]
    );

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
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details. Please try again later.'
    });
  }
};

exports.updateUser = async (req, res) => {
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
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user. Please try again later.'
    });
  }
};

exports.deleteUser = async (req, res) => {
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
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user. Please try again later.'
    });
  }
};
