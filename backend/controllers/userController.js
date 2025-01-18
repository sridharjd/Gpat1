const db = require('../config/db');

const getAllUsers = async (req, res) => {
  const [users] = await db.query('SELECT id, username, is_admin FROM users');
  res.json(users);
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  const [user] = await db.query('SELECT id, username, is_admin FROM users WHERE id = ?', [id]);
  res.json(user[0]);
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, is_admin } = req.body;

  await db.query('UPDATE users SET username = ?, is_admin = ? WHERE id = ?', [username, is_admin, id]);

  res.json({ message: 'User updated successfully' });
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// Export the functions
module.exports = { getAllUsers, getUserById, updateUser, deleteUser };