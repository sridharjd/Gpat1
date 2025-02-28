const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigrations() {
  try {
    // Create connection without database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'login@2021'
    });

    // Create database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS gpat_pyq_db');
    await connection.query('USE gpat_pyq_db');

    // Read schema file
    console.log('Running initial schema...');
    const schemaSQL = await fs.readFile(path.join(__dirname, '../db/db.sql'), 'utf8');
    await connection.query(schemaSQL);
    console.log('Initial schema applied successfully.');

    // Read and execute all migration files
    console.log('Running migrations...');
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);
    
    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`);
        const migrationSQL = await fs.readFile(path.join(migrationsDir, file), 'utf8');
        try {
          await connection.query(migrationSQL);
          console.log(`Migration ${file} completed successfully`);
        } catch (err) {
          console.error(`Error in migration ${file}:`, err);
          throw new Error(`Migration ${file} failed`);
        }
      }
    }

    console.log('All migrations completed successfully');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
