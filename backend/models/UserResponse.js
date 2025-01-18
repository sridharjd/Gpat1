const db = require('../config/db');

class UserResponse {
  static async createResponse(username, questionId, userAnswer, isCorrect) {
    await db.query(
      'INSERT INTO user_responses (username, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)',
      [username, questionId, userAnswer, isCorrect]
    );
  }
}

module.exports = UserResponse;