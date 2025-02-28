const db = require('../config/db');

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ message, error: error.message });
};

const getUserPerformanceData = async (username) => {
  try {
    const [performance] = await db.query(
      `SELECT 
        COALESCE(AVG(score), 0) as averageScore,
        COUNT(*) as totalTests,
        COALESCE(MAX(score), 0) as highestScore
      FROM user_performance
      WHERE username = ?`,
      [username]
    );

    return performance[0] || {};
  } catch (error) {
    console.error('Error fetching user performance data:', error);
    throw error;
  }
};

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
    handleError(res, error, 'Error fetching dashboard data');
  }
};

const getPerformanceData = async (req, res) => {
  try {
    const username = req.user.username;
    const performance = await getUserPerformanceData(username);

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

    res.json({
      success: true,
      data: {
        ...performance,
        subjectPerformance,
        recentTests: recentTests.map(test => ({
          ...test,
          subjects: test.subjects ? test.subjects.split(',') : []
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    handleError(res, error, 'Error fetching performance data');
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
    handleError(res, error, 'Error fetching recent tests');
  }
};

const getProgressData = async (req, res) => {
  try {
    const username = req.user.username;
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
    handleError(res, error, 'Error fetching progress data');
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
    handleError(res, error, 'Error fetching subject performance');
  }
};

module.exports = {
  getDashboardData,
  getPerformanceData,
  getRecentTests,
  getProgressData,
  getSubjectPerformance
};