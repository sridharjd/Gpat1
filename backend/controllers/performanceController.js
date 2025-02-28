const db = require('../config/db');

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ message, error: error.message });
};

const getPerformance = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id || typeof user_id !== 'string' || user_id.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'User ID is required and must be a non-empty string'
    });
  }

  try {
    console.log(`Fetching performance data for user ${user_id}`);

    // Fetch overall performance data
    const [performance] = await db.query(
      'SELECT score, total_questions, test_date FROM user_performance WHERE user_id = ? ORDER BY test_date DESC',
      [user_id]
    );

    if (!performance || performance.length === 0) {
      console.log(`No performance data found for user ${user_id}`);
      throw new Error('Failed to fetch performance data');
    }

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

    console.log(`Fetched performance data for user ${user_id}`);
    res.json({
      success: true,
      data: {
        overall: performance,
        bySubject: subjectPerformance
      }
    });
  } catch (error) {
    console.error(`Error fetching performance data for user ${user_id}:`, error);
    handleError(res, error, 'Error fetching performance data');
  }
};

module.exports = { getPerformance };