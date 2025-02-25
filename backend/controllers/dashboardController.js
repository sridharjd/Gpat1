const db = require('../config/db');

const getDashboardData = async (req, res) => {
  try {
    console.log('Fetching dashboard data...');
    
    // Fetch total users
    const [users] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
    if (!users || !users.length) {
      throw new Error('Failed to fetch user count');
    }

    // Fetch total questions
    const [questions] = await db.query('SELECT COUNT(*) as totalQuestions FROM questions');
    if (!questions || !questions.length) {
      throw new Error('Failed to fetch question count');
    }

    // Fetch total tests
    const [tests] = await db.query('SELECT COUNT(*) as totalTests FROM user_performance');
    if (!tests || !tests.length) {
      throw new Error('Failed to fetch test count');
    }

    // Fetch data for questions per year
    const [yearsData] = await db.query(
      'SELECT year, COUNT(*) as count FROM questions GROUP BY year ORDER BY year'
    );

    // Fetch data for questions per subject
    const [subjectsData] = await db.query(
      'SELECT s.name AS subject, COUNT(*) as count FROM questions q JOIN subjects s ON q.subject_id = s.id GROUP BY s.name'
    );

    res.json({
      success: true,
      data: {
        totalUsers: users[0].totalUsers,
        totalQuestions: questions[0].totalQuestions,
        totalTests: tests[0].totalTests,
        years: yearsData.map((row) => row.year),
        yearCounts: yearsData.map((row) => row.count),
        subjects: subjectsData.map((row) => row.subject),
        subjectCounts: subjectsData.map((row) => row.count),
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

const getPerformanceData = async (req, res) => {
  try {
    const username = req.user.username;
    
    // Fetch user's performance data
    const [performance] = await db.query(
      `SELECT 
        COALESCE(AVG(score), 0) as averageScore,
        COUNT(*) as totalTests,
        COALESCE(MAX(score), 0) as highestScore
      FROM user_performance
      WHERE username = ?`,
      [username]
    );

    // Get subject performance data with default values for new users
    const [subjectPerformance] = await db.query(
      `SELECT 
        s.name as subject,
        COALESCE(AVG(CASE WHEN ur.is_correct THEN 1 ELSE 0 END) * 100, 0) as averageScore,
        COUNT(DISTINCT up.id) as testCount
      FROM subjects s
      LEFT JOIN questions q ON s.id = q.subject_id
      LEFT JOIN user_responses ur ON q.id = ur.question_id
      LEFT JOIN user_performance up ON ur.performance_id = up.id AND up.username = ?
      GROUP BY s.id, s.name
      ORDER BY s.name`,
      [username]
    );

    // Get recent tests data
    const [recentTests] = await db.query(
      `SELECT 
        up.id,
        up.score,
        up.total_questions,
        up.correct_answers,
        up.created_at as date,
        GROUP_CONCAT(DISTINCT s.name) as subjects
      FROM user_performance up
      LEFT JOIN user_responses ur ON up.id = ur.performance_id
      LEFT JOIN questions q ON ur.question_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE up.username = ?
      GROUP BY up.id
      ORDER BY up.created_at DESC
      LIMIT 5`,
      [username]
    );

    if (!performance || !performance[0]) {
      return res.json({
        success: true,
        data: {
          averageScore: 0,
          totalTests: 0,
          highestScore: 0,
          subjectPerformance: [],
          recentTests: []
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...performance[0],
        subjectPerformance,
        recentTests: recentTests.map(test => ({
          ...test,
          subjects: test.subjects ? test.subjects.split(',') : []
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance data. Please try again later.'
    });
  }
};

const getRecentTests = async (req, res) => {
  try {
    const username = req.user.username;
    
    const [recentTests] = await db.query(
      `SELECT 
        up.id,
        up.score,
        up.total_questions,
        up.correct_answers,
        up.created_at,
        GROUP_CONCAT(DISTINCT s.name) as subjects
      FROM user_performance up
      LEFT JOIN user_responses ur ON up.id = ur.performance_id
      LEFT JOIN questions q ON ur.question_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE up.username = ?
      GROUP BY up.id
      ORDER BY up.created_at DESC
      LIMIT 5`,
      [username]
    );

    res.json({
      success: true,
      data: recentTests.map(test => ({
        ...test,
        subjects: test.subjects ? test.subjects.split(',') : []
      }))
    });
  } catch (error) {
    console.error('Error fetching recent tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent tests. Please try again later.'
    });
  }
};

const getProgressData = async (req, res) => {
  try {
    const username = req.user.username;
    
    // Fetch user's progress data (last 7 tests)
    const [progressData] = await db.query(
      `SELECT 
        DATE(created_at) as date,
        AVG(score) as averageScore,
        COUNT(*) as testsCount
      FROM user_performance
      WHERE username = ?
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
      LIMIT 7`,
      [username]
    );

    res.json({
      success: true,
      data: progressData.reverse() // Send in chronological order
    });
  } catch (error) {
    console.error('Error fetching progress data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress data'
    });
  }
};

const getSubjectPerformance = async (req, res) => {
  try {
    const username = req.user.username;
    
    const [subjectPerformance] = await db.query(
      `SELECT 
        s.name,
        COUNT(DISTINCT q.id) as total_questions,
        COUNT(DISTINCT CASE WHEN ur.id IS NOT NULL THEN q.id END) as total_attempted,
        SUM(CASE WHEN ur.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        AVG(CASE WHEN ur.is_correct = 1 THEN 1 ELSE 0 END) * 100 as accuracy
      FROM subjects s
      LEFT JOIN questions q ON s.id = q.subject_id
      LEFT JOIN user_responses ur ON q.id = ur.question_id
      LEFT JOIN user_performance up ON ur.performance_id = up.id AND up.username = ?
      GROUP BY s.id, s.name
      ORDER BY s.name`,
      [username]
    );

    res.json({
      success: true,
      data: subjectPerformance.map(s => ({
        subject: s.name,
        total_questions: s.total_questions || 0,
        total_attempted: s.total_attempted || 0,
        correct_answers: s.correct_answers || 0,
        accuracy: Number(s.accuracy || 0).toFixed(1)
      }))
    });
  } catch (error) {
    console.error('Error fetching subject performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subject performance. Please try again later.'
    });
  }
};

module.exports = {
  getDashboardData,
  getPerformanceData,
  getRecentTests,
  getProgressData,
  getSubjectPerformance
};