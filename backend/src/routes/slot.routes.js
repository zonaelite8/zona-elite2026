const express = require('express');
const router = express.Router();
const { getSlots, createSlot, getAdminSlots, deleteSlot, createWeeklySlots } = require('../controllers/slot.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Anyone can view available slots
router.get('/', getSlots);

// Admin routes for slots
router.get('/admin', authenticateToken, isAdmin, getAdminSlots);
router.post('/', authenticateToken, isAdmin, createSlot);
router.post('/weekly', authenticateToken, isAdmin, createWeeklySlots);
router.delete('/:id', authenticateToken, isAdmin, deleteSlot);

module.exports = router;
