const db = require('../config/db');

class Question {
  static async getAllQuestions() {
    const [rows] = await db.query('SELECT * FROM pyq_questions');
    return rows;
  }

  static async getQuestionsByFilters(year, subject, degree) {
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
  }
}

module.exports = Question;