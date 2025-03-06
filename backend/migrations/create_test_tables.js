const db = require('../config/db').pool;
const logger = require('../config/logger');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Create test_results table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        subject_id INT,
        total_questions INT NOT NULL DEFAULT 0,
        score DECIMAL(5,2) NOT NULL DEFAULT 0,
        duration INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      )
    `);

    // Create test_answers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS test_answers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        test_id INT NOT NULL,
        question_id INT NOT NULL,
        selected_answer CHAR(1) NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT FALSE,
        points INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (test_id) REFERENCES test_results(id),
        FOREIGN KEY (question_id) REFERENCES questions(id)
      )
    `);

    await connection.commit();
    logger.info('Test tables created successfully');
  } catch (error) {
    await connection.rollback();
    logger.error('Error creating test tables:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function down() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Drop tables in reverse order due to foreign key constraints
    await connection.query('DROP TABLE IF EXISTS test_answers');
    await connection.query('DROP TABLE IF EXISTS test_results');

    await connection.commit();
    logger.info('Test tables dropped successfully');
  } catch (error) {
    await connection.rollback();
    logger.error('Error dropping test tables:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration
up().catch(console.error); 