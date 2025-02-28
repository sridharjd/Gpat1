const db = require('../config/db');

class UserPerformance {
  static async createPerformance(username, score, totalQuestions) {
    try {
      await db.query(
        'INSERT INTO user_performance (username, score, total_questions) VALUES (?, ?, ?)',
        [username, score, totalQuestions]
      );
    } catch (error) {
      console.error('Error creating user performance:', error);
      throw new Error('Database error while creating user performance');
    }
  }
}

module.exports = UserPerformance;