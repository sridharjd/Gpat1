const db = require('../config/db');
const logger = require('../config/logger'); // Assuming a logger module is available

const handleError = (res, error, message, statusCode = 500) => {
  logger.error(`${message}: ${error.message}`, error); // Use a logger for better error logging
  res.status(statusCode).json({ message, error: error.message });
};

const getAllSubjects = async (req, res) => {
  try {
    const [subjects] = await db.query('SELECT * FROM subjects');
    res.json(subjects);
  } catch (error) {
    logger.error('Error fetching subjects:', error); // Log the error before calling handleError
    handleError(res, error, 'Error fetching subjects');
  }
};

module.exports = { getAllSubjects };