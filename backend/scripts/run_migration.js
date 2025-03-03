const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigration(migrationFile) {
  try {
    console.log(`Running migration: ${migrationFile}...`);

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split the SQL file into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());

    // Execute each statement
    for (let statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
        console.log('Executed SQL statement successfully');
      }
    }
    console.log(`Migration ${migrationFile} completed successfully.`);
  } catch (error) {
    console.error(`Error during migration ${migrationFile}:`, error);
    throw new Error(`Migration ${migrationFile} failed`);
  }
}

// Run the migration
const migrationFile = process.argv[2] || '002_add_pyq_questions.sql';
runMigration(migrationFile)
  .then(() => {
    console.log('Migration process completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration process failed:', err);
    process.exit(1);
  }); 