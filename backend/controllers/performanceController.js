const db = require('../config/db');

const getPerformance = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Fetch performance data for the user
    const [performance] = await db.query(
      'SELECT score, total_questions, test_date FROM user_performance WHERE user_id = ? ORDER BY test_date DESC',
      [user_id]
    );

    // Fetch subject-wise performance data
    const [subjectPerformance] = await db.query(
      `SELECT s.name AS subject, 
              COUNT(r.id) AS total_attempted, 
              SUM(r.is_correct) AS correct_answers, 
              (SELECT COUNT(*) FROM pyq_questions WHERE subject_id = s.id) AS total_questions
       FROM subjects s
       LEFT JOIN pyq_questions q ON s.id = q.subject_id
       LEFT JOIN user_responses r ON q.id = r.question_id AND r.user_id = ?
       GROUP BY s.name`,
      [user_id]
    );

    res.json({ performance, subjectPerformance });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ message: 'Error fetching performance data' });
  }
};

module.exports = { getPerformance };