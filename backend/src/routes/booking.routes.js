const express = require('express');
const router = express.Router();
const { createBooking, createAdminBooking, getUserBookings, cancelBooking, getAllBookings, getBookingByToken, cancelBookingByToken } = require('../controllers/booking.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Protected routes for users
router.post('/', authenticateToken, createBooking);
router.get('/my-bookings', authenticateToken, getUserBookings);
router.delete('/:id', authenticateToken, cancelBooking);

// Public routes for email cancellation
router.get('/token/:token', getBookingByToken);
router.post('/cancel-token', cancelBookingByToken);

// Protected routes for admins
router.post('/admin', authenticateToken, isAdmin, createAdminBooking);
router.get('/all', authenticateToken, isAdmin, getAllBookings);

module.exports = router;
