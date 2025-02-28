const mysql = require('mysql2/promise');

async function checkTables() {
  let connection;
  try {
    // Create connection pool
    connection = await mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'login@2021',
      database: 'pharma_prep',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Check if test_results table exists
    const [tables] = await connection.query('SHOW TABLES LIKE "test_results"');
    console.log('test_results table exists:', tables.length > 0);

    // If table exists, show its structure
    if (tables.length > 0) {
      const [columns] = await connection.query('DESCRIBE test_results');
      console.log('\nTable structure:');
      columns.forEach(col => {
        console.log(` - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key} ${col.Default ? 'DEFAULT ' + col.Default : ''}`);
      });
    }

    // Check if test_answers table exists
    const [answerTables] = await connection.query('SHOW TABLES LIKE "test_answers"');
    console.log('\ntest_answers table exists:', answerTables.length > 0);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();
