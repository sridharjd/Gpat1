const db = require('../config/db');

const getDashboardData = async (req, res) => {
  try {
    const [users] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
    const [questions] = await db.query('SELECT COUNT(*) as totalQuestions FROM pyq_questions');
    const [tests] = await db.query('SELECT COUNT(*) as totalTests FROM user_performance');

    // Fetch data for questions per year
    const [yearsData] = await db.query(
      'SELECT year, COUNT(*) as count FROM pyq_questions GROUP BY year ORDER BY year'
    );

    // Fetch data for questions per subject
    const [subjectsData] = await db.query(
      'SELECT s.name AS subject, COUNT(*) as count FROM pyq_questions q JOIN subjects s ON q.subject_id = s.id GROUP BY s.name'
    );

    res.json({
      totalUsers: users[0].totalUsers,
      totalQuestions: questions[0].totalQuestions,
      totalTests: tests[0].totalTests,
      years: yearsData.map((row) => row.year),
      yearCounts: yearsData.map((row) => row.count),
      subjects: subjectsData.map((row) => row.subject),
      subjectCounts: subjectsData.map((row) => row.count),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};

module.exports = { getDashboardData };