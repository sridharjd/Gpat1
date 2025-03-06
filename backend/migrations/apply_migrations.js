const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config/env');

async function applyMigrations() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true // Enable multiple statements for migrations
  });

  try {
    console.log('Starting database migrations...');
    
    // Read and execute all .sql files in the migrations directory
    const migrationFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Execute in alphabetical order

    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}`);
      const migration = fs.readFileSync(path.join(__dirname, file), 'utf8');
      await connection.query(migration);
      console.log(`Successfully applied migration: ${file}`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Run migrations
applyMigrations(); 