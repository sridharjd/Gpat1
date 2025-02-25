const db = require('../config/db');

class User {
  static async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async createUser({ username, password, email, isAdmin = false }) {
    const [result] = await db.query(
      'INSERT INTO users (username, password, email, is_admin) VALUES (?, ?, ?, ?)',
      [username, password, email, isAdmin]
    );
    return result.insertId;
  }

  static async updateUser(id, userData) {
    const allowedFields = ['username', 'email', 'phone_number', 'bio'];
    const updates = [];
    const values = [];

    allowedFields.forEach(field => {
      if (userData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(userData[field]);
      }
    });

    if (updates.length === 0) return false;

    values.push(id);
    const [result] = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async verifyEmail(id) {
    const [result] = await db.query(
      'UPDATE users SET is_verified = TRUE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async updatePassword(id, newPassword) {
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPassword, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;