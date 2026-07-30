const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dns = require('dns');
require('dotenv').config();

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Global Auto-Healing: Evita que la app se cierre por errores fatales
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Auto-healing activo...', err.name, err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Auto-healing activo...', err.name, err.message);
});

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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Límite de peticiones por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.' }
});

app.use(helmet()); // Blindaje de headers HTTP
app.use(compression()); // Compresión GZIP para carga ULTRARÁPIDA
app.use(limiter); // Protección anti-DDoS básica

app.use(cors({
  origin: '*', // Allow all origins for simplicity or customize to frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Ultra-lightweight wake endpoint (no DB, instant response)
app.get('/api/wake', (req, res) => {
  res.json({ status: 'awake', ts: Date.now() });
});

// Check server status
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zona Elite API is running smoothly', version: '1.0.7-IPV4-ACTIVE' });
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

app.get('/api/check-db-host', (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  const extDbUrl = process.env.EXTERNAL_DATABASE_URL;
  res.json({
    dbHost: dbUrl ? dbUrl.match(/@([^:/]+)/)?.[1] : 'NOT SET',
    extDbHost: extDbUrl ? extDbUrl.match(/@([^:/]+)/)?.[1] : 'NOT SET',
  });
});

app.get('/api/test-email', async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4,
      auth: {
        user: process.env.EMAIL_USER || 'zonaelite8@gmail.com',
        pass: process.env.EMAIL_PASS || 'bbiljzqpincehysh'
      },
      connectionTimeout: 10000
    });

    await transporter.verify();

    res.json({ success: true, message: 'SMTP credentials verified successfully via IPv4 SSL Port 465' });
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

// Global Error Handler - log full error for debugging
app.use((err, req, res, next) => {
  console.error('Global error:', err.message, err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!', detail: err.message });
});

// Start listening IMMEDIATELY - don't wait for DB migrations
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Run migrations in background — failures won't crash the server
  setTimeout(async () => {
    try {
      await initializeDatabaseAndAdmin(false);
      console.log('Database migrated & admin verified successfully at startup.');
    } catch (error) {
      console.error('Database migration failed at startup:', error.message);
      // Don't crash — server stays up, migrations can be retried via /api/setup
    }
  }, 2000); // 2 second delay to let the server fully boot first

  // Keep-alive: Self-ping every 14 min to prevent Render free tier from sleeping
  const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  setInterval(async () => {
    try {
      const res = await fetch(`${RENDER_URL}/health`);
      console.log(`[Keep-Alive] Ping OK — status ${res.status}`);
    } catch (err) {
      console.log('[Keep-Alive] Ping failed (non-fatal):', err.message);
    }
  }, KEEP_ALIVE_INTERVAL);
  console.log(`[Keep-Alive] Self-ping activo cada ${KEEP_ALIVE_INTERVAL / 60000} minutos`);
});

