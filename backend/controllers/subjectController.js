const db = require('../config/db');

const getAllSubjects = async (req, res) => {
  try {
    const [subjects] = await db.query('SELECT * FROM subjects');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects' });
  }
};

module.exports = { getAllSubjects };