const db = require('../config/db');

const submitTest = async (req, res) => {
  const { user_id, responses } = req.body;

  if (!user_id || !responses || Object.keys(responses).length === 0) {
    return res.status(400).json({ message: 'User ID and at least one response are required' });
  }

  try {
    let score = 0;
    const totalQuestions = Object.keys(responses).length;

    for (const [questionId, userAnswer] of Object.entries(responses)) {
      const [question] = await db.query('SELECT * FROM pyq_questions WHERE id = ?', [questionId]);

      if (!question.length) {
        return res.status(400).json({ message: `Question with ID ${questionId} not found` });
      }

      const isCorrect = userAnswer === question[0].answer;

      if (isCorrect) score++;

      await db.query(
        'INSERT INTO user_responses (user_id, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)',
        [user_id, questionId, userAnswer, isCorrect]
      );
    }

    await db.query(
      'INSERT INTO user_performance (user_id, score, total_questions) VALUES (?, ?, ?)',
      [user_id, score, totalQuestions]
    );

    res.json({ score, totalQuestions });
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: 'Error submitting test', error: error.message });
  }
};
module.exports = { submitTest };