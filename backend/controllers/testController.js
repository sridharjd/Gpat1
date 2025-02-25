const db = require('../config/db');

// Get test questions
const getTestQuestions = async (req, res) => {
  try {
    const { subject_id, year, count = 10 } = req.query;
    
    let query = `
      SELECT 
        q.id,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.year,
        s.name as subject_name
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (subject_id) {
      query += ' AND q.subject_id = ?';
      queryParams.push(subject_id);
    }

    if (year) {
      query += ' AND q.year = ?';
      queryParams.push(parseInt(year));
    }
    
    query += ' ORDER BY RAND() LIMIT ?';
    queryParams.push(parseInt(count));

    const [questions] = await db.query(query, queryParams);

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found for the given criteria'
      });
    }

    // Remove correct_answer from response
    const sanitizedQuestions = questions.map(q => {
      const { correct_answer, ...rest } = q;
      return rest;
    });

    res.json({
      success: true,
      data: sanitizedQuestions
    });
  } catch (error) {
    console.error('Error fetching test questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions. Please try again.'
    });
  }
};

// Get test filters (subjects and years)
const getTestFilters = async (req, res) => {
  try {
    // Get subjects
    const [subjects] = await db.query(
      'SELECT id, name FROM subjects ORDER BY name'
    );

    // Get years
    const [years] = await db.query(
      'SELECT DISTINCT year FROM questions WHERE year IS NOT NULL ORDER BY year DESC'
    );

    res.json({
      success: true,
      data: {
        subjects,
        years: years.map(y => y.year)
      }
    });
  } catch (error) {
    console.error('Error fetching test filters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filters. Please try again.'
    });
  }
};

// Submit test
const submitTest = async (req, res) => {
  const { username, responses, timeTaken } = req.body;

  if (!username || !responses || Object.keys(responses).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Username and at least one response are required'
    });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = Object.keys(responses).length;

    // Get correct answers and question details for all questions
    const questionIds = Object.keys(responses);
    const [questions] = await connection.query(
      `SELECT 
        q.id,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.year,
        s.name as subject_name
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id
      WHERE q.id IN (?)`,
      [questionIds]
    );

    if (!questions || questions.length === 0) {
      throw new Error('No questions found');
    }

    const correctAnswersMap = questions.reduce((map, q) => {
      map[q.id] = q.correct_answer;
      return map;
    }, {});

    // Check answers and count correct ones
    for (const [questionId, userAnswer] of Object.entries(responses)) {
      if (correctAnswersMap[questionId] === userAnswer) {
        correctAnswers++;
      }
    }

    const incorrectAnswers = totalQuestions - correctAnswers;
    const score = (correctAnswers / totalQuestions) * 100;

    // Create performance record
    const [performanceResult] = await connection.query(
      `INSERT INTO user_performance 
       (username, score, total_questions, correct_answers, incorrect_answers, time_taken) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, score, totalQuestions, correctAnswers, incorrectAnswers, timeTaken]
    );

    if (!performanceResult || !performanceResult.insertId) {
      throw new Error('Failed to create performance record');
    }

    // Store individual responses
    const performanceId = performanceResult.insertId;
    const responseValues = Object.entries(responses).map(([questionId, answer]) => [
      performanceId,
      questionId,
      answer,
      answer === correctAnswersMap[questionId],
      timeTaken
    ]);

    await connection.query(
      `INSERT INTO user_responses 
       (performance_id, question_id, selected_answer, is_correct, time_taken) 
       VALUES ?`,
      [responseValues]
    );

    await connection.commit();

    // Map questions with answers and correct/incorrect status
    const questionDetails = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      subject_name: q.subject_name,
      year: q.year,
      correct_answer: q.correct_answer,
      user_answer: responses[q.id],
      is_correct: responses[q.id] === q.correct_answer
    }));

    res.json({
      success: true,
      data: {
        score,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        timeTaken,
        questions: questionDetails
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error submitting test:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit test. Please try again.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  getTestQuestions,
  submitTest,
  getTestFilters
};