const db = require('../config/db');

class Question {
  static async getAllQuestions() {
    try {
      const [rows] = await db.query('SELECT * FROM pyq_questions');
      return rows;
    } catch (error) {
      console.error('Error fetching all questions:', error);
      throw new Error('Database error while fetching questions');
    }
  }

  static async getQuestionsByFilters(year, subject, degree) {
    try {
      let query = 'SELECT * FROM pyq_questions WHERE 1=1';
      const params = [];

      if (year) {
        query += ' AND year = ?';
        params.push(year);
      }

      if (subject) {
        query += ' AND subject = ?';
        params.push(subject);
      }

      if (degree) {
        query += ' AND degree = ?';
        params.push(degree);
      }

      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error fetching questions by filters:', error);
      throw new Error('Database error while fetching filtered questions');
    }
  }
}

module.exports = Question;