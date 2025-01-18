const db = require('../config/db');

class UserPerformance {
  static async createPerformance(username, score, totalQuestions) {
    await db.query(
      'INSERT INTO user_performance (username, score, total_questions) VALUES (?, ?, ?)',
      [username, score, totalQuestions]
    );
  }
}

module.exports = UserPerformance;