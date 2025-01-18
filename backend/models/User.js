const db = require('../config/db');

class User {
  static async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }

  static async createUser(username, password, isAdmin = 0) {
    const [result] = await db.query(
      'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
      [username, password, isAdmin]
    );
    return result.insertId;
  }
}

module.exports = User;