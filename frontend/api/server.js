const express = require('express');
const cors = require('cors');

// Routes
const authRoutes = require('./_lib/routes/auth.routes');
const slotRoutes = require('./_lib/routes/slot.routes');
const bookingRoutes = require('./_lib/routes/booking.routes');
const notificationRoutes = require('./_lib/routes/notification.routes');
const userRoutes = require('./_lib/routes/user.routes');
const planRoutes = require('./_lib/routes/plan.routes');
const { initializeDatabaseAndAdmin } = require('./_lib/setup_admin');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Wake endpoint (instant, no DB)
app.get('/api/wake', (req, res) => {
  res.json({ status: 'awake', ts: Date.now() });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zona Elite API on Vercel', version: '2.0.0' });
});

// Setup/migrate endpoint
app.get('/api/setup', async (req, res) => {
  try {
    const message = await initializeDatabaseAndAdmin();
    res.json({ success: true, message });
  } catch (error) {
    console.error('Error in /api/setup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  res.status(500).json({ error: 'Something went wrong on the server!', detail: err.message });
});

// Run DB migrations lazily on first request
let _migrated = false;
const originalHandler = app;

module.exports = async (req, res) => {
  if (!_migrated) {
    try {
      await initializeDatabaseAndAdmin();
      _migrated = true;
    } catch (err) {
      console.error('Migration failed (non-fatal):', err.message);
      // Don't block requests if migration fails
    }
  }
  return originalHandler(req, res);
};
