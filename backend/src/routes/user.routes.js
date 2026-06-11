const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Only admins can manage users
router.use(authenticateToken, isAdmin);

// Get all users
router.get('/', userController.getAllUsers);

// Update user available classes
router.put('/:id/classes', userController.updateUserClasses);

// Delete a user
router.delete('/:id', userController.deleteUser);

module.exports = router;
