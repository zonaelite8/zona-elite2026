const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const slotRoutes = require('./routes/slot.routes');
const bookingRoutes = require('./routes/booking.routes');
const notificationRoutes = require('./routes/notification.routes');
const userRoutes = require('./routes/user.routes');
const planRoutes = require('./routes/plan.routes');
const { initializeDatabaseAndAdmin } = require('../setup_admin');

const app = express();
const PORT = process.env.PORT || 5005;

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

// Diagnostic: check email config (instant, no sending)
app.get('/api/check-config', (req, res) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  res.json({ 
    emailUser: emailUser || 'NOT SET',
    emailPassLength: emailPass ? emailPass.length : 0,
    emailPassPreview: emailPass ? emailPass.substring(0, 4) + '****' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'not set'
  });
});

app.get('/api/test-email', async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER || 'zonaelite8@gmail.com',
        pass: process.env.EMAIL_PASS || 'bbiljzqpincehysh'
      },
      connectionTimeout: 10000
    });
    
    await transporter.verify();
    
    res.json({ success: true, message: 'SMTP credentials verified successfully' });
  } catch (error) {
    res.json({ success: false, error: error.message || String(error) });
  }
});

// Setup DB and Admin (useful for Render free tier)
app.get('/api/setup', async (req, res) => {
  try {
    const message = await initializeDatabaseAndAdmin(false);
    res.json({ success: true, message });
  } catch (error) {
    console.error('Error in /api/setup:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || String(error),
      stack: error.stack || null
    });
  }
});

app.get('/api/migrate-plans', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const db = require('./config/db');
    const sqlPath = path.join(__dirname, '../../migration_plans.sql');
    let sql = '';
    if (fs.existsSync(sqlPath)) {
      sql = fs.readFileSync(sqlPath, 'utf8');
    } else {
      sql = fs.readFileSync(path.join(__dirname, '../migration_plans.sql'), 'utf8');
    }
    await db.query(sql);
    res.json({ success: true, message: 'Planes migration applied successfully' });
  } catch (error) {
    console.error('Error in /api/migrate-plans:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start listening
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await initializeDatabaseAndAdmin(false);
    console.log('Database migrated & admin verified successfully at startup.');
  } catch (error) {
    console.error('Database migration failed at startup:', error);
  }
});
