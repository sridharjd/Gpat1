const db = require('../config/db').pool;
const logger = require('../config/logger');

async function migrate() {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get existing columns
    const [columns] = await connection.query('DESCRIBE users');
    const existingColumns = columns.map(col => col.Field);

    // Add columns if they don't exist
    const columnsToAdd = [
      {
        name: 'login_attempts',
        definition: 'INT DEFAULT 0'
      },
      {
        name: 'last_failed_login',
        definition: 'DATETIME NULL'
      },
      {
        name: 'refresh_token',
        definition: 'TEXT NULL'
      },
      {
        name: 'verification_token',
        definition: 'VARCHAR(255) NULL'
      },
      {
        name: 'verification_token_expires',
        definition: 'DATETIME NULL'
      },
      {
        name: 'password_changed_at',
        definition: 'DATETIME NULL'
      }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        await connection.query(
          `ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`
        );
        logger.info(`Added column: ${column.name}`);
      } else {
        logger.info(`Column already exists: ${column.name}`);
      }
    }

    await connection.commit();
    logger.info('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Run migration
migrate().catch(error => {
  logger.error('Migration failed:', error);
  process.exit(1);
}); 