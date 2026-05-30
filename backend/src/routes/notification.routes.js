const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notification.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All notification routes are for admin
router.get('/', authenticateToken, isAdmin, getNotifications);
router.put('/:id/read', authenticateToken, isAdmin, markAsRead);

module.exports = router;
