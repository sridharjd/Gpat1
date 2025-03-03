const db = require('../config/db');
const xlsx = require('xlsx');

// Function to handle errors
const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ message, error: error.message });
};

// Function to get all questions
const getAllQuestions = async (req, res) => {
  try {
    const [questions] = await db.query('SELECT * FROM pyq_questions');
    res.json(questions);
  } catch (error) {
    handleError(res, error, 'Error fetching questions');
  }
};

// Function to get questions by filters
const getQuestionsByFilters = async (req, res) => {
  const { subject_id, year, user_id } = req.query;

  try {
    let query = `
      SELECT q.*, s.name AS subject_name
      FROM pyq_questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (subject_id) {
      query += ' AND q.subject_id IN (?)';
      params.push(subject_id.split(','));
    }

    if (year) {
      query += ' AND q.year IN (?)';
      params.push(year.split(','));
    }

    const [questions] = await db.query(query, params);
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    handleError(res, error, 'Error fetching questions');
  }
};

// Function to get unique years
const getUniqueYears = async (req, res) => {
  try {
    const [years] = await db.query('SELECT DISTINCT year FROM pyq_questions ORDER BY year DESC');
    res.json(years.map((row) => row.year));
  } catch (error) {
    handleError(res, error, 'Error fetching years');
  }
};

// Function to get a question by ID
const getQuestionById = async (req, res) => {
  const { id } = req.params;
  try {
    const [question] = await db.query('SELECT * FROM pyq_questions WHERE id = ?', [id]);
    res.json(question[0]);
  } catch (error) {
    handleError(res, error, 'Error fetching question');
  }
};

// Function to update a question
const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { question, subject_id, year, answer, option1, option2, option3, option4, degree } = req.body;

  try {
    await db.query(
      'UPDATE pyq_questions SET question = ?, subject_id = ?, year = ?, answer = ?, option1 = ?, option2 = ?, option3 = ?, option4 = ?, degree = ? WHERE id = ?',
      [question, subject_id, year, answer, option1, option2, option3, option4, degree, id]
    );
    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    handleError(res, error, 'Error updating question');
  }
};

// Function to delete a question
const deleteQuestion = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM pyq_questions WHERE id = ?', [id]);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Error deleting question');
  }
};

// Function to update questions from an Excel file
const updateQuestionsFromFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'The uploaded file contains no data.' });
    }

    // Validate and insert each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel row number (1-indexed + header row)
      
      // Check for required fields
      if (!row.question) {
        return res.status(400).json({ message: `Row ${rowNumber}: Missing question` });
      }
      
      if (!row.subject) {
        return res.status(400).json({ message: `Row ${rowNumber}: Missing subject for question: "${row.question.substring(0, 30)}..."` });
      }
      
      if (!row.year) {
        return res.status(400).json({ message: `Row ${rowNumber}: Missing year for question: "${row.question.substring(0, 30)}..."` });
      }
      
      if (!row.answer) {
        return res.status(400).json({ message: `Row ${rowNumber}: Missing answer for question: "${row.question.substring(0, 30)}..."` });
      }
      
      if (!row.option1 || !row.option2 || !row.option3 || !row.option4) {
        return res.status(400).json({ 
          message: `Row ${rowNumber}: Missing one or more options for question: "${row.question.substring(0, 30)}..."` 
        });
      }

      // Get subject_id from subjects table using subject name
      const [subjectResult] = await db.query('SELECT id FROM subjects WHERE name = ?', [row.subject]);
      if (!subjectResult.length) {
        return res.status(400).json({ 
          message: `Row ${rowNumber}: Invalid subject: "${row.subject}" for question: "${row.question.substring(0, 30)}..."` 
        });
      }

      const subject_id = subjectResult[0].id;

      // Validate that answer is one of the options
      const answer = row.answer.toString().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(answer)) {
        return res.status(400).json({ 
          message: `Row ${rowNumber}: Invalid answer format. Must be A, B, C, or D for question: "${row.question.substring(0, 30)}..."` 
        });
      }

      // Insert the question into the database
      await db.query(
        'INSERT INTO pyq_questions (year, subject_id, question, answer, option1, option2, option3, option4, degree) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [row.year, subject_id, row.question, answer, row.option1, row.option2, row.option3, row.option4, row.degree || null]
      );
    }

    res.json({ message: `${data.length} questions uploaded successfully.` });
  } catch (error) {
    console.error('Error updating questions:', error);
    handleError(res, error, 'Error updating questions.');
  }
};

// Export all functions
module.exports = {
  getAllQuestions,
  getQuestionsByFilters,
  getUniqueYears,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  updateQuestionsFromFile,
};