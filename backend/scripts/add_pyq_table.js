const db = require('../config/db');

async function addPyqQuestionsTable() {
  try {
    console.log('Adding pyq_questions table...');

    // Drop the table if it exists
    await db.query('DROP TABLE IF EXISTS pyq_questions');
    console.log('Dropped existing pyq_questions table if it existed');

    // Create the table
    const createTableSQL = `
      CREATE TABLE pyq_questions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        year INT,
        subject_id INT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT,
        option1 TEXT,
        option2 TEXT,
        option3 TEXT,
        option4 TEXT,
        degree VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      )
    `;
    
    await db.query(createTableSQL);
    console.log('Created pyq_questions table successfully');
    
    console.log('Table creation completed successfully.');
  } catch (error) {
    console.error('Error creating pyq_questions table:', error);
    throw error;
  }
}

// Run the function
addPyqQuestionsTable()
  .then(() => {
    console.log('Process completed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Process failed:', err);
    process.exit(1);
  }); 