const db = require('../config/db');

class User {
  static async findByUsername(username) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
      return rows[0];
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw new Error('Database error while finding user');
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Database error while finding user');
    }
  }

  static async createUser({ username, password, email, isAdmin = false }) {
    try {
      const [result] = await db.query(
        'INSERT INTO users (username, password, email, is_admin) VALUES (?, ?, ?, ?)',
        [username, password, email, isAdmin]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Database error while creating user');
    }
  }

  static async updateUser(id, userData) {
    try {
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
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Database error while updating user');
    }
  }

  static async verifyEmail(id) {
    try {
      const [result] = await db.query(
        'UPDATE users SET is_verified = TRUE WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw new Error('Database error while verifying email');
    }
  }

  static async updatePassword(id, newPassword) {
    try {
      const [result] = await db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [newPassword, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Database error while updating password');
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0]; // Return the first user found
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Database error while finding user');
    }
  }
}

module.exports = User;