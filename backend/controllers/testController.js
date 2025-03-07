const db = require('../config/db').pool;
const logger = require('../config/logger');
const { ApiError } = require('../utils/errors');
const { catchAsync } = require('../utils/errors');
const { validateTest } = require('../utils/validation');
const cache = require('../config/cache');
const { safeToUpperCase } = require('../utils/stringUtils');

// Error handler helper
const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ message, error: error.message });
};

// Helper function to normalize answer
const normalizeAnswer = (answer) => {
  if (!answer) return null;
  return String(answer).trim().toLowerCase();
};

// Get test questions with caching
const getTestQuestions = catchAsync(async (req, res) => {
  const { count = 10, subject_id, year } = req.query;
  const userId = req.user.id;

  let query = `
    SELECT 
      q.id,
      q.question_text,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.correct_answer,
      q.explanation,
      q.degree,
      s.name as subject_name
    FROM questions q
    JOIN subjects s ON q.subject_id = s.id
    WHERE q.is_active = true
  `;

  const params = [];

  if (subject_id) {
    query += ' AND q.subject_id = ?';
    params.push(subject_id);
  }

  if (year) {
    query += ' AND q.year = ?';
    params.push(year);
  }

  query += ' ORDER BY RAND() LIMIT ?';
  params.push(parseInt(count));

  console.log('Executing query:', query);
  console.log('With params:', params);

  const [questions] = await db.query(query, params);
  console.log('Query result:', questions);

  if (!questions.length) {
    // Let's check if there are any questions at all
    const [allQuestions] = await db.query('SELECT COUNT(*) as count FROM questions');
    console.log('Total questions in database:', allQuestions[0].count);
    
    // Check if there are any active questions
    const [activeQuestions] = await db.query('SELECT COUNT(*) as count FROM questions WHERE is_active = true');
    console.log('Active questions in database:', activeQuestions[0].count);
    
    throw new ApiError('No questions found for the selected criteria', 404);
  }

  res.json({
    success: true,
    data: questions.map(question => ({
      id: question.id,
      question: question.question_text,
      options: {
        A: question.option_a,
        B: question.option_b,
        C: question.option_c,
        D: question.option_d
      },
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      difficulty: question.degree,
      subject: {
        id: question.subject_id,
        name: question.subject_name
      }
    }))
  });
});

// Get test filters with caching
const getTestFilters = catchAsync(async (req, res) => {
  const cacheKey = 'test:filters';
  const cachedFilters = await cache.get(cacheKey);

  if (cachedFilters) {
    return res.json(JSON.parse(cachedFilters));
  }

  // Get subjects
  const [subjects] = await db.query(
    'SELECT id, name FROM subjects WHERE is_active = true ORDER BY name'
  );

  // Get years with question counts
  const [years] = await db.query(
    'SELECT DISTINCT year FROM questions WHERE year IS NOT NULL ORDER BY year DESC'
  );

  // Get difficulty levels with counts
  const [difficulties] = await db.query(`
    SELECT 
      degree,
      COUNT(*) as question_count
    FROM questions
    WHERE degree IS NOT NULL AND is_active = true
    GROUP BY degree
    ORDER BY degree
  `);

  const result = {
    success: true,
    data: {
      subjects: subjects.map(s => ({
        id: s.id,
        name: s.name
      })),
      years: years.map(y => y.year),
      difficulties: difficulties.map(d => ({
        level: d.degree,
        count: d.question_count
      }))
    }
  };

  // Cache for 1 hour
  await cache.set(cacheKey, JSON.stringify(result), 3600);

  res.json(result);
});

// Submit test with transaction and validation
const submitTest = catchAsync(async (req, res) => {
  const { answers, testData } = req.body;
  const userId = req.user.id;
  
  // Validate test submission
  const validation = validateTest({ answers, testData });
  if (!validation.isValid) {
    throw new ApiError(validation.errors.join(', '), 400);
  }

  // Start transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Create test result
    const [result] = await connection.query(
      `INSERT INTO test_results (
        user_id, 
        subject_id, 
        total_questions, 
        score, 
        correct_answers,
        incorrect_answers,
        time_taken,
        started_at,
        completed_at
      ) VALUES (?, ?, ?, 0, 0, 0, ?, NOW(), NOW())`,
      [userId, testData.subjectId, testData.totalQuestions, testData.timeTaken]
    );

    const testId = result.insertId;
    let totalScore = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;

    // Process each answer
    for (const [questionId, answer] of Object.entries(answers)) {
      // Get question details
      const [question] = await connection.query(
        'SELECT correct_answer FROM questions WHERE id = ?',
        [questionId]
      );

      if (!question[0]) {
        throw new ApiError(`Question ${questionId} not found`, 404);
      }

      const isCorrect = answer === question[0].correct_answer;
      // Each question is worth 1 point
      const points = isCorrect ? 1 : 0;
      totalScore += points;
      
      if (isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }

      // Record answer
      await connection.query(
        `INSERT INTO test_answers (test_result_id, question_id, selected_answer, is_correct, time_taken)
         VALUES (?, ?, ?, ?, ?)`,
        [testId, questionId, answer, isCorrect, 0] // Using 0 for time_taken as it's not tracked per question
      );
    }

    // Update test result with final score and counts
    await connection.query(
      `UPDATE test_results 
       SET score = ?, 
           correct_answers = ?,
           incorrect_answers = ?
       WHERE id = ?`,
      [totalScore, correctAnswers, incorrectAnswers, testId]
    );

    await connection.commit();

    res.json({
      success: true,
      data: {
        resultId: testId,
        score: totalScore,
        totalQuestions: testData.totalQuestions,
        timeTaken: testData.timeTaken,
        correctAnswers,
        incorrectAnswers
      }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

// Get user's test history with pagination and caching
const getTestHistory = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Try cache first
  const cacheKey = `user:${userId}:tests:${page}:${limit}`;
  const cachedHistory = await cache.get(cacheKey);

  if (cachedHistory) {
    return res.json(JSON.parse(cachedHistory));
  }
  
  // Get total count
  const [countResult] = await db.query(
    'SELECT COUNT(*) as total FROM test_results WHERE user_id = ?',
    [userId]
  );
  
  const total = countResult[0].total;
  
  // Get paginated test history with details
  const [tests] = await db.query(`
    SELECT 
      tr.id,
      tr.total_questions,
      tr.score,
      tr.time_taken,
      tr.created_at,
      s.name as subject_name,
      (
        SELECT COUNT(*)
        FROM test_answers ta
        WHERE ta.test_id = tr.id AND ta.is_correct = true
      ) as correct_answers,
      (
        SELECT GROUP_CONCAT(DISTINCT q.topic)
        FROM test_answers ta
        JOIN questions q ON ta.question_id = q.id
        WHERE ta.test_id = tr.id
      ) as topics
    FROM test_results tr
    LEFT JOIN subjects s ON tr.subject_id = s.id
    WHERE tr.user_id = ?
    ORDER BY tr.created_at DESC
    LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  const result = {
    success: true,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    tests: tests.map(test => ({
      id: test.id,
      totalQuestions: test.total_questions,
      score: test.score,
      correctAnswers: test.correct_answers,
      timeTaken: test.time_taken,
      completedAt: test.created_at,
      subject: test.subject_name ? {
        name: test.subject_name
      } : null,
      topics: test.topics ? test.topics.split(',') : []
    }))
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, JSON.stringify(result), 300);

  res.json(result);
});

// Get specific test details with caching
const getTestById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Try cache first
  const cacheKey = `test:${id}:${userId}`;
  const cachedTest = await cache.get(cacheKey);

  if (cachedTest) {
    return res.json(JSON.parse(cachedTest));
  }

  // Get test details with answers
  const [tests] = await db.query(`
    SELECT 
      tr.*,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'questionId', ta.question_id,
          'question', q.question_text,
          'selectedAnswer', ta.selected_answer,
          'correctAnswer', q.correct_answer,
          'isCorrect', ta.is_correct,
          'points', ta.points,
          'explanation', q.explanation
        )
      ) as answers
    FROM test_results tr
    LEFT JOIN test_answers ta ON tr.id = ta.test_id
    LEFT JOIN questions q ON ta.question_id = q.id
    WHERE tr.id = ? AND tr.user_id = ?
    GROUP BY tr.id`,
    [id, userId]
  );

  if (!tests[0]) {
    throw new ApiError('Test not found', 404);
  }

  const test = tests[0];
  test.answers = JSON.parse(test.answers);

  const result = {
    success: true,
    test: {
      id: test.id,
      totalQuestions: test.total_questions,
      score: test.score,
      timeTaken: test.time_taken,
      completedAt: test.created_at,
      subject: test.subject_name ? {
        name: test.subject_name
      } : null,
      answers: test.answers
    }
  };

  // Cache for 1 hour
  await cache.set(cacheKey, JSON.stringify(result), 3600);

  res.json(result);
});

// Get test statistics with caching
const getTestStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  // Try cache first
  const cacheKey = `user:${userId}:stats`;
  const cachedStats = await cache.get(cacheKey);

  if (cachedStats) {
    return res.json(JSON.parse(cachedStats));
  }

  // Get overall statistics
  const [overallStats] = await db.query(`
    SELECT 
      COUNT(*) as total_tests,
      SUM(score) as total_score,
      ROUND(AVG(score), 2) as avg_score,
      MAX(score) as highest_score,
      SUM(time_taken) as total_time,
      COUNT(DISTINCT subject_id) as subjects_covered
    FROM test_results
    WHERE user_id = ?
  `, [userId]);

  // Get subject-wise performance
  const [subjectStats] = await db.query(`
    SELECT 
      s.name as subject_name,
      COUNT(*) as tests_taken,
      ROUND(AVG(tr.score), 2) as avg_score,
      MAX(tr.score) as highest_score
    FROM test_results tr
    JOIN subjects s ON tr.subject_id = s.id
    WHERE tr.user_id = ?
    GROUP BY s.id
    ORDER BY avg_score DESC
  `, [userId]);

  // Get recent improvement trend
  const [recentTrend] = await db.query(`
    SELECT 
      DATE(created_at) as test_date,
      COUNT(*) as tests_taken,
      ROUND(AVG(score), 2) as avg_score
    FROM test_results
    WHERE user_id = ? 
    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY test_date
  `, [userId]);

  const result = {
    success: true,
    stats: {
      overall: {
        totalTests: overallStats[0].total_tests,
        totalScore: overallStats[0].total_score,
        averageScore: overallStats[0].avg_score,
        highestScore: overallStats[0].highest_score,
        totalTime: overallStats[0].total_time,
        subjectsCovered: overallStats[0].subjects_covered
      },
      bySubject: subjectStats.map(stat => ({
        subject: {
          name: stat.subject_name
        },
        testsTaken: stat.tests_taken,
        averageScore: stat.avg_score,
        highestScore: stat.highest_score
      })),
      recentTrend: recentTrend.map(trend => ({
        date: trend.test_date,
        testsTaken: trend.tests_taken,
        averageScore: trend.avg_score
      }))
    }
  };

  // Cache for 1 hour
  await cache.set(cacheKey, JSON.stringify(result), 3600);

  res.json(result);
});

// Export all functions
module.exports = {
  getTestQuestions,
  getTestFilters,
  submitTest,
  getTestHistory,
  getTestById,
  getTestStats
};