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
    const [users] = await db.query('SELECT * FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const [user] = await db.query('UPDATE users SET ? WHERE id = ?', [req.body, req.params.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const [user] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
