const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings, cancelBooking, getAllBookings } = require('../controllers/booking.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Protected routes for users
router.post('/', authenticateToken, createBooking);
router.get('/my-bookings', authenticateToken, getUserBookings);
router.delete('/:id', authenticateToken, cancelBooking);

// Protected routes for admins
router.get('/all', authenticateToken, isAdmin, getAllBookings);

module.exports = router;
