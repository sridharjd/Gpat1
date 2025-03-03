const db = require('../config/db');

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ message, error: error.message });
};

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
    handleError(res, error, 'Error fetching test questions');
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
    handleError(res, error, 'Error fetching test filters');
  }
};

// Submit test
const submitTest = async (req, res) => {
  try {
    const { answers, testData } = req.body;
    const userId = req.user.id;
    
    if (!answers || !testData || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Start a transaction
    await db.query('START TRANSACTION');
    
    // 1. Create test record
    const [testResult] = await db.query(
      `INSERT INTO test_results 
       (user_id, subject_id, total_questions, score, time_taken, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        testData.subjectId || null,
        testData.totalQuestions || answers.length,
        testData.score || 0,
        testData.timeTaken || 0
      ]
    );
    
    const testId = testResult.insertId;
    
    // 2. Save individual question answers
    const answerValues = Object.entries(answers).map(([questionId, answer]) => [
      testId,
      questionId,
      answer,
      null, // is_correct will be updated in the next step
      new Date()
    ]);
    
    if (answerValues.length > 0) {
      await db.query(
        `INSERT INTO test_answers 
         (test_id, question_id, selected_answer, is_correct, created_at) 
         VALUES ?`,
        [answerValues]
      );
    }
    
    // 3. Calculate score by comparing with correct answers
    const questionIds = Object.keys(answers);
    
    if (questionIds.length > 0) {
      const [questions] = await db.query(
        `SELECT id, correct_answer FROM questions WHERE id IN (?)`,
        [questionIds]
      );
      
      let score = 0;
      const questionMap = {};
      
      questions.forEach(q => {
        questionMap[q.id] = q.correct_answer;
      });
      
      // Update is_correct for each answer
      for (const [questionId, answer] of Object.entries(answers)) {
        const isCorrect = answer === questionMap[questionId];
        if (isCorrect) score++;
        
        await db.query(
          `UPDATE test_answers SET is_correct = ? 
           WHERE test_id = ? AND question_id = ?`,
          [isCorrect, testId, questionId]
        );
      }
      
      // Update the final score
      await db.query(
        `UPDATE test_results SET score = ? WHERE id = ?`,
        [score, testId]
      );
    }
    
    // Commit the transaction
    await db.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: {
        testId,
        score: testData.score || 0,
        totalQuestions: testData.totalQuestions || answers.length
      },
      message: 'Test submitted successfully'
    });
  } catch (error) {
    // Rollback in case of error
    await db.query('ROLLBACK');
    handleError(res, error, 'Error submitting test');
  }
};

// Get user's test history
const getTestHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;
    
    // Get test history with subject information
    const [tests] = await db.query(
      `SELECT 
        tr.id, 
        tr.total_questions, 
        tr.score, 
        tr.time_taken, 
        tr.created_at,
        s.name as subject_name
      FROM test_results tr
      LEFT JOIN subjects s ON tr.subject_id = s.id
      WHERE tr.user_id = ?
      ORDER BY tr.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );
    
    // Get total count for pagination
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM test_results WHERE user_id = ?',
      [userId]
    );
    
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: {
        tests,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    handleError(res, error, 'Error fetching test history');
  }
};

// Get a specific test by ID
const getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get test details
    const [test] = await db.query(
      `SELECT 
        tr.id, 
        tr.total_questions, 
        tr.score, 
        tr.time_taken, 
        tr.created_at,
        s.name as subject_name
      FROM test_results tr
      LEFT JOIN subjects s ON tr.subject_id = s.id
      WHERE tr.id = ? AND tr.user_id = ?`,
      [id, userId]
    );
    
    if (!test || test.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    // Get test answers with questions
    const [answers] = await db.query(
      `SELECT 
        ta.question_id,
        ta.selected_answer,
        ta.is_correct,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer
      FROM test_answers ta
      JOIN questions q ON ta.question_id = q.id
      WHERE ta.test_id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        test: test[0],
        answers
      }
    });
  } catch (error) {
    handleError(res, error, 'Error fetching test details');
  }
};

// Get test statistics
const getTestStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get overall test statistics
    const [overallStats] = await db.query(
      `SELECT 
        COUNT(*) as total_tests,
        AVG(score) as average_score,
        MAX(score) as highest_score,
        SUM(total_questions) as total_questions_attempted,
        AVG(time_taken) as average_time
      FROM test_results
      WHERE user_id = ?`,
      [userId]
    );
    
    // Get subject-wise statistics
    const [subjectStats] = await db.query(
      `SELECT 
        s.name as subject_name,
        COUNT(tr.id) as tests_taken,
        AVG(tr.score) as average_score
      FROM test_results tr
      JOIN subjects s ON tr.subject_id = s.id
      WHERE tr.user_id = ?
      GROUP BY tr.subject_id
      ORDER BY average_score DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        overall: overallStats[0],
        subjects: subjectStats
      }
    });
  } catch (error) {
    handleError(res, error, 'Error fetching test statistics');
  }
};

// Export all functions
module.exports = {
  getTestQuestions,
  getTestFilters,
  submitTest,
  getTestHistory,
  getTestById,
  getTestStats
};