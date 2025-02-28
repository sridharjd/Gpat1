const db = require('../config/db');

class UserResponse {
  static async createResponse(username, questionId, userAnswer, isCorrect) {
    try {
      await db.query(
        'INSERT INTO user_responses (username, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)',
        [username, questionId, userAnswer, isCorrect]
      );
    } catch (error) {
      console.error('Error creating user response:', error);
      throw {
        name: 'DatabaseError',
        message: 'Database error while creating user response',
        cause: error,
      };
    }
  }
}

module.exports = UserResponse;