const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, deleteAllNotifications } = require('../controllers/notification.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All notification routes are for admin
router.get('/', authenticateToken, isAdmin, getNotifications);
router.put('/:id/read', authenticateToken, isAdmin, markAsRead);
router.delete('/', authenticateToken, isAdmin, deleteAllNotifications);

module.exports = router;
