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
    
    // Split and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    for (const statement of statements) {
      if (statement.toLowerCase().includes('create database') || statement.toLowerCase().includes('use ')) {
        continue; // Skip database creation and use statements
      }
      try {
        await connection.query(statement);
      } catch (err) {
        console.error('Error executing statement:', statement);
        console.error('Error:', err);
      }
    }
    console.log('Initial schema created successfully');

    // Read and execute all migration files
    console.log('Running migrations...');
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);
    
    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`);
        const migrationSQL = await fs.readFile(path.join(migrationsDir, file), 'utf8');
        const migrationStatements = migrationSQL
          .split(';')
          .map(statement => statement.trim())
          .filter(statement => statement.length > 0);

        for (const statement of migrationStatements) {
          try {
            await connection.query(statement);
          } catch (err) {
            console.error(`Error in migration ${file}:`, err);
          }
        }
        console.log(`Migration ${file} completed successfully`);
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
