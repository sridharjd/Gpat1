const express = require('express');
const userController = require('../controllers/userController'); // Ensure this path is correct

const router = express.Router();

router.get('/users', userController.getAllUsers); // Ensure getAllUsers is defined
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

module.exports = router;