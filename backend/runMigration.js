const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
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
      queueLimit: 0,
      multipleStatements: true // Important for running multiple SQL statements
    });

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '004_create_test_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    console.log('Running migration...');
    const [results] = await connection.query(sql);
    console.log('Migration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
