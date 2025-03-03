const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function insertAdminUser() {
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('login@2021', salt);

    const query = `
      INSERT INTO users (
        username, 
        email, 
        password, 
        phone_number, 
        is_admin
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      'admin123', 
      'admin@123.com', 
      hashedPassword, 
      null,  // phone_number 
      true   // is_admin
    ];

    const [result] = await db.query(query, values);
    console.log('Admin user inserted successfully:', result.insertId);
  } catch (error) {
    console.error('Error inserting admin user:', error);
  } finally {
    // Close the database connection
    await db.end();
  }
}

insertAdminUser();