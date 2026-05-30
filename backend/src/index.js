const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const slotRoutes = require('./routes/slot.routes');
const bookingRoutes = require('./routes/booking.routes');
const notificationRoutes = require('./routes/notification.routes');
const { initializeDatabaseAndAdmin } = require('../setup_admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for simplicity or customize to frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Check server status
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zona Elite API is running smoothly' });
});

// Setup DB and Admin (useful for Render free tier)
app.get('/api/setup', async (req, res) => {
  try {
    const message = await initializeDatabaseAndAdmin(false);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin/notifications', notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
