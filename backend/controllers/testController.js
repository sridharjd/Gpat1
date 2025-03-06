const db = require('../config/db').pool;
const logger = require('../config/logger');
const { ApiError } = require('../utils/errors');
const { catchAsync } = require('../utils/errors');
const { validateTest } = require('../utils/validation');
const cache = require('../config/cache');

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ message, error: error.message });
};

// Get test questions with caching
const getTestQuestions = catchAsync(async (req, res) => {
  const { subject_id, year, count = 10, difficulty } = req.query;
  
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
      q.difficulty_level,
      s.name as subject_name,
      s.code as subject_code
    FROM questions q
    JOIN subjects s ON q.subject_id = s.id
    WHERE q.is_active = true
  `;
  
  const params = [];
  
  if (subject_id) {
    query += ' AND q.subject_id IN (?)';
    params.push(subject_id.split(','));
  }

  if (year) {
    query += ' AND q.year IN (?)';
    params.push(year.split(','));
  }

  if (difficulty) {
    query += ' AND q.difficulty_level IN (?)';
    params.push(difficulty.split(','));
  }
  
  query += ' ORDER BY RAND() LIMIT ?';
  params.push(parseInt(count));

  const [questions] = await db.query(query, params);

  if (!questions || questions.length === 0) {
    throw new ApiError('No questions found for the given criteria', 404);
  }

  // Remove correct_answer from response for security
  const sanitizedQuestions = questions.map(q => {
    const { correct_answer, ...rest } = q;
    return {
      ...rest,
      options: {
        a: q.option_a,
        b: q.option_b,
        c: q.option_c,
        d: q.option_d
      }
    };
  });

  res.json({
    success: true,
    count: sanitizedQuestions.length,
    questions: sanitizedQuestions
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
  const [subjects] = await db.query(`
    SELECT 
      id, 
      name,
      code,
      COUNT(q.id) as question_count
    FROM subjects s
    LEFT JOIN questions q ON q.subject_id = s.id AND q.is_active = true
    GROUP BY s.id
    HAVING question_count > 0
    ORDER BY s.name
  `);

  // Get years with question counts
  const [years] = await db.query(`
    SELECT 
      year,
      COUNT(*) as question_count
    FROM questions
    WHERE year IS NOT NULL AND is_active = true
    GROUP BY year
    ORDER BY year DESC
  `);

  // Get difficulty levels with counts
  const [difficulties] = await db.query(`
    SELECT 
      difficulty_level,
      COUNT(*) as question_count
    FROM questions
    WHERE difficulty_level IS NOT NULL AND is_active = true
    GROUP BY difficulty_level
    ORDER BY difficulty_level
  `);

  const result = {
    success: true,
    filters: {
      subjects: subjects.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        questionCount: s.question_count
      })),
      years: years.map(y => ({
        year: y.year,
        questionCount: y.question_count
      })),
      difficulties: difficulties.map(d => ({
        level: d.difficulty_level,
        questionCount: d.question_count
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
  
  if (!answers || !testData) {
    throw new ApiError('Missing required fields', 400);
  }

  // Validate test data
  const validation = validateTest(testData);
  if (!validation.isValid) {
    throw new ApiError(validation.message, 400);
  }

  // Start transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Create test record
    const [testResult] = await connection.query(
      `INSERT INTO test_results (
        user_id,
        subject_id,
        total_questions,
        score,
        time_taken,
        created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        userId,
        testData.subjectId || null,
        testData.totalQuestions || Object.keys(answers).length,
        0, // Initial score, will be updated
        testData.timeTaken || 0
      ]
    );
    
    const testId = testResult.insertId;
    
    // 2. Get correct answers in bulk
    const questionIds = Object.keys(answers);
    const [questions] = await connection.query(
      'SELECT id, correct_answer, points FROM questions WHERE id IN (?)',
      [questionIds]
    );
    
    // Create a map for quick lookup
    const questionMap = new Map(
      questions.map(q => [q.id, { answer: q.correct_answer, points: q.points }])
    );
    
    // 3. Process answers and calculate score
    let totalScore = 0;
    const answerValues = [];
    
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = questionMap.get(parseInt(questionId));
      if (!question) continue;

      const isCorrect = answer.toUpperCase() === question.answer.toUpperCase();
      if (isCorrect) {
        totalScore += question.points || 1;
      }

      answerValues.push([
        testId,
        questionId,
        answer.toUpperCase(),
        isCorrect,
        question.points || 1,
        new Date()
      ]);
    }

    // 4. Bulk insert answers
    if (answerValues.length > 0) {
      await connection.query(
        `INSERT INTO test_answers (
          test_id,
          question_id,
          selected_answer,
          is_correct,
          points,
          created_at
        ) VALUES ?`,
        [answerValues]
      );
    }
    
    // 5. Update final score
    await connection.query(
      'UPDATE test_results SET score = ? WHERE id = ?',
      [totalScore, testId]
    );

    // 6. Update user statistics
    await connection.query(`
      INSERT INTO user_statistics (
        user_id,
        total_tests,
        total_score,
        total_time,
        avg_score,
        last_test_at
      ) VALUES (?, 1, ?, ?, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
        total_tests = total_tests + 1,
        total_score = total_score + ?,
        total_time = total_time + ?,
        avg_score = (total_score + ?) / (total_tests + 1),
        last_test_at = CURRENT_TIMESTAMP
    `, [
      userId,
      totalScore,
      testData.timeTaken || 0,
      totalScore,
      totalScore,
      testData.timeTaken || 0,
      totalScore
    ]);
    
    await connection.commit();

    // Clear related caches
    await Promise.all([
      cache.del(`user:${userId}:stats`),
      cache.del(`user:${userId}:tests:*`)
    ]);

    logger.info('Test submitted successfully', {
      userId,
      testId,
      score: totalScore,
      questionCount: answerValues.length
    });

    res.status(201).json({
      success: true,
      test: {
        id: testId,
        score: totalScore,
        totalQuestions: answerValues.length,
        timeTaken: testData.timeTaken || 0,
        subjectId: testData.subjectId
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
      s.code as subject_code,
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
        name: test.subject_name,
        code: test.subject_code
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
      s.name as subject_name,
      s.code as subject_code,
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
    LEFT JOIN subjects s ON tr.subject_id = s.id
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
        name: test.subject_name,
        code: test.subject_code
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
      s.code as subject_code,
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
          name: stat.subject_name,
          code: stat.subject_code
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