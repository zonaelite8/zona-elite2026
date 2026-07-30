import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// ─── Database ────────────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_KAo4Uz7RlxdM@ep-steep-snow-atiy8vue-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_m';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Access denied: Admin role required' });
}

const formatTo12Hour = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY || Buffer.from('cmVfYkFnemNWQkdfRVU1cUhKM2hERHc1VUM2aUp0emNFTHNr', 'base64').toString('ascii');

function renderEmailTemplate(title, bodyHtml) {
  return `
  <div style="background-color:#000000;padding:40px 15px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f59e0b;line-height:1.6;margin:0">
    <div style="max-width:560px;margin:0 auto;background:#050505;border:2px solid #f59e0b;border-radius:18px;overflow:hidden;box-shadow:0 0 30px rgba(245,158,11,0.2)">
      <!-- Header / Logo Oficial Zona Élite -->
      <div style="background:#000000;padding:32px 24px;text-align:center;border-bottom:2px solid #f59e0b">
        <a href="https://zonaelitemarinilla.com" style="text-decoration:none;display:inline-block">
          <img src="https://zonaelitemarinilla.com/logo-oficial.png" alt="Zona Élite Logo Oficial" width="220" style="display:block;margin:0 auto;border:0;outline:none;max-width:100%;height:auto" />
        </a>
      </div>
      <!-- Content (Negro y Amarillo) -->
      <div style="padding:36px 28px;background:#050505;color:#f59e0b">
        <h2 style="color:#f59e0b;margin-top:0;margin-bottom:24px;font-size:22px;font-weight:800;letter-spacing:0.5px;text-align:center;text-transform:uppercase;border-bottom:1px stroke #f59e0b">${title}</h2>
        <div style="color:#ffffff;font-size:15px;line-height:1.7">
          ${bodyHtml}
        </div>
      </div>
      <!-- Footer -->
      <div style="background:#000000;padding:24px;text-align:center;border-top:2px solid #f59e0b;font-size:13px;color:#f59e0b">
        <p style="margin:0 0 10px 0;font-weight:700">📍 Zona Élite Marinilla — Entrenamiento de Alto Rendimiento</p>
        <p style="margin:0"><a href="https://zonaelitemarinilla.com" style="color:#f59e0b;text-decoration:underline;font-weight:800;letter-spacing:1px">zonaelitemarinilla.com</a></p>
      </div>
    </div>
  </div>`;
}

async function sendEmail(to, subject, text, html) {
  try {
    const rawRecipients = Array.isArray(to) ? to : [to];
    const recipients = rawRecipients.map(e => String(e).trim().toLowerCase()).filter(Boolean);
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Zona Elite <info@zonaelitemarinilla.com>';
    const finalHtml = renderEmailTemplate(subject, html || `<p>${text}</p>`);
    
    const payload = {
      from: fromAddress,
      reply_to: 'zonaelite8@gmail.com',
      to: recipients,
      subject: subject,
      text: text || '',
      html: finalHtml
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Resend Response status:', response.status, data);
    if (!response.ok) {
      console.error('Resend delivery failed:', data);
    }
    return { status: response.status, data };
  } catch (e) {
    console.error('Resend fetch error:', e.message);
    return { error: e.message };
  }
}

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

// Debug: log every request URL
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} url=${req.url} originalUrl=${req.originalUrl} path=${req.path} baseUrl=${req.baseUrl}`);
  next();
});

// Debug route to check what URL format Vercel sends
app.get('/api/debug', (req, res) => res.json({ url: req.url, originalUrl: req.originalUrl, path: req.path, baseUrl: req.baseUrl }));

// ─── Wake / Health ───────────────────────────────────────────────────────────
app.get('/api/wake', (req, res) => res.json({ status: 'awake', ts: Date.now() }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Zona Elite API on Vercel Serverless', version: '3.0.0' }));
app.get('/api/test-email', async (req, res) => {
  try {
    const targetEmail = req.query.email || 'zonaelite8@gmail.com';
    const result = await sendEmail(targetEmail, 'Prueba Zona Elite', 'Este es un correo de prueba de Zona Elite', '<h1>Correo de prueba exitoso</h1>');
    res.json({ result, targetEmail, apiKeyPreview: RESEND_API_KEY ? RESEND_API_KEY.substring(0, 7) + '...' : 'NONE' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message, stack: e.stack });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, cedula } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    const cleanEmail = email.trim().toLowerCase();
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Este correo ya está registrado' });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone, cedula, role, is_verified, verify_token) VALUES ($1,$2,$3,$4,$5,$6,true,$7) RETURNING id, name, email, role',
      [name, cleanEmail, hash, phone || null, cedula || null, 'client', code]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, cedula: user.cedula }, JWT_SECRET, { expiresIn: '7d' });
    
    // Send welcome email with await (required in Serverless)
    try {
      await sendEmail(
        cleanEmail, 
        '¡Bienvenido a Zona Elite!', 
        `Hola ${name}, tu cuenta ha sido creada exitosamente en Zona Elite.`, 
        `<p style="font-size:16px">Hola <strong>${name}</strong>,</p><p>Tu cuenta ha sido creada exitosamente en Zona Élite.</p><p>Ya puedes ingresar a la plataforma y reservar tus clases de entrenamiento.</p>`
      );
    } catch (emailErr) {
      console.error('Welcome email error:', emailErr);
    }

    return res.status(201).json({ message: 'Registro exitoso.', token, user });
  } catch (e) { console.error('Register error:', e); return res.status(500).json({ error: 'Error en el registro', detail: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    if (!user.is_verified) return res.status(403).json({ error: 'Debes verificar tu correo electrónico antes de iniciar sesión.' });
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, cedula: user.cedula }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, cedula: user.cedula } });
  } catch (e) { console.error('Login error:', e); return res.status(500).json({ error: 'Internal server error', detail: e.message }); }
});

app.post('/api/auth/google-login', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const { sub: googleId, name, email } = ticket.getPayload();
    let user = (await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email])).rows[0];
    if (!user) {
      const result = await pool.query('INSERT INTO users (name, email, google_id, role, is_verified) VALUES ($1,$2,$3,$4,true) RETURNING *', [name, email, googleId, 'client']);
      user = result.rows[0];
    } else if (!user.google_id) {
      await pool.query('UPDATE users SET google_id = $1, is_verified = true WHERE id = $2', [googleId, user.id]);
      user.google_id = googleId;
    }
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, cedula: user.cedula }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, cedula: user.cedula } });
  } catch (e) { console.error('Google login error:', e); return res.status(500).json({ error: 'Error en login con Google', detail: e.message }); }
});

app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND verify_token = $2', [email, code]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Código de verificación incorrecto' });
    await pool.query('UPDATE users SET is_verified = true, verify_token = NULL WHERE email = $1', [email]);
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, cedula: user.cedula }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ message: 'Correo verificado exitosamente', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, cedula: user.cedula } });
  } catch (e) { return res.status(500).json({ error: 'Error al verificar código', detail: e.message }); }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, cedula, currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    if (newPassword) {
      const user = (await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId])).rows[0];
      if (user.password_hash && currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
      await pool.query('UPDATE users SET name=$1, phone=$2, cedula=$3, password_hash=$4 WHERE id=$5', [name, phone, cedula, hash, userId]);
    } else {
      await pool.query('UPDATE users SET name=$1, phone=$2, cedula=$3 WHERE id=$4', [name, phone, cedula, userId]);
    }
    const updated = (await pool.query('SELECT id, name, email, role, phone, cedula FROM users WHERE id = $1', [userId])).rows[0];
    const token = jwt.sign({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, phone: updated.phone, cedula: updated.cedula }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ message: 'Perfil actualizado', token, user: updated });
  } catch (e) { return res.status(500).json({ error: 'Error al actualizar perfil', detail: e.message }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = (await pool.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
    if (!user) return res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await pool.query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [resetToken, expires, user.id]);
    const resetUrl = `https://zonaelitemarinilla.com/reset-password?token=${resetToken}`;
    await sendEmail(email, 'Recuperar Contraseña - Zona Elite', '', `<h2>Recuperar Contraseña</h2><p>Haz clic en el siguiente enlace:</p><a href="${resetUrl}">${resetUrl}</a><p>Este enlace expira en 1 hora.</p>`);
    return res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación' });
  } catch (e) { return res.status(500).json({ error: 'Error al procesar solicitud', detail: e.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = (await pool.query('SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()', [token])).rows[0];
    if (!user) return res.status(400).json({ error: 'Token inválido o expirado' });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [hash, user.id]);
    return res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (e) { return res.status(500).json({ error: 'Error al restablecer contraseña', detail: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SLOTS ROUTES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/slots', async (req, res) => {
  try {
    const { date } = req.query;
    let q = `SELECT s.id, s.modality, s.date, s.start_time, s.end_time, s.capacity, s.is_blocked, COALESCE(COUNT(b.id),0)::int AS bookings_count FROM slots s LEFT JOIN bookings b ON s.id = b.slot_id`;
    const params = [];
    if (date) { q += ` WHERE s.date = $1`; params.push(date); } else { q += ` WHERE s.date >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date`; }
    q += ` GROUP BY s.id ORDER BY s.date ASC, s.start_time ASC`;
    const result = await pool.query(q, params);
    const allSlots = result.rows;
    const timeBlockMap = {};
    allSlots.forEach(s => { const k = `${s.date}_${s.start_time}`; if (!timeBlockMap[k]) timeBlockMap[k] = { slots: [] }; timeBlockMap[k].slots.push(s); });
    const enriched = allSlots.map(slot => {
      const k = `${slot.date}_${slot.start_time}`; const block = timeBlockMap[k];
      const fuerzaSlot = block.slots.find(s => s.modality === 'fuerza');
      const personalSlot = block.slots.find(s => s.modality === 'personalizado');
      const fB = fuerzaSlot ? fuerzaSlot.bookings_count : 0;
      const pB = personalSlot ? personalSlot.bookings_count : 0;
      let cross_blocked = slot.modality === 'fuerza' ? pB >= 2 : fB >= 3;
      return { ...slot, spots_left: slot.capacity - slot.bookings_count, cross_blocked, fuerza_booked_in_block: fB, personalizado_booked_in_block: pB };
    });
    return res.json(enriched);
  } catch (e) { console.error('Slots error:', e); return res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/slots/admin', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    let q = `SELECT s.id, s.modality, s.date, s.start_time, s.end_time, s.capacity, s.is_blocked, COALESCE(json_agg(json_build_object('booking_id',b.id,'user_id',u.id,'user_name',u.name,'user_email',u.email,'booked_at',b.created_at)) FILTER (WHERE b.id IS NOT NULL),'[]') as bookings FROM slots s LEFT JOIN bookings b ON s.id = b.slot_id LEFT JOIN users u ON b.user_id = u.id`;
    const params = [];
    if (date) { q += ` WHERE s.date = $1`; params.push(date); } else { q += ` WHERE s.date >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date`; }
    q += ` GROUP BY s.id ORDER BY s.date ASC, s.start_time ASC, s.modality ASC`;
    const result = await pool.query(q, params);
    return res.json(result.rows);
  } catch (e) { console.error('Admin slots error:', e); return res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/slots', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { modality, date, start_time, end_time, capacity } = req.body;
    const existing = await pool.query('SELECT id FROM slots WHERE modality=$1 AND date=$2 AND start_time=$3', [modality, date, start_time]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Ya existe un horario con esa configuración' });
    const result = await pool.query('INSERT INTO slots (modality,date,start_time,end_time,capacity) VALUES ($1,$2,$3,$4,$5) RETURNING *', [modality, date, start_time, end_time, capacity]);
    return res.status(201).json(result.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error creating slot', detail: e.message }); }
});

app.post('/api/slots/weekly', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { dates, start_times, end_times, create_fuerza = true, create_personalizado = false } = req.body;
    const created = []; const skipped = [];
    for (const d of dates) {
      for (let i = 0; i < start_times.length; i++) {
        const st = start_times[i]; const et = end_times[i];
        if (create_fuerza) {
          const check = await pool.query('SELECT id FROM slots WHERE modality=$1 AND date=$2 AND start_time=$3', ['fuerza', d, st]);
          if (check.rows.length === 0) { const r = await pool.query('INSERT INTO slots (modality,date,start_time,end_time,capacity) VALUES ($1,$2,$3,$4,$5) RETURNING *', ['fuerza', d, st, et, 5]); created.push(r.rows[0]); }
          else skipped.push({ modality: 'fuerza', date: d, start_time: st });
        }
        if (create_personalizado) {
          const check = await pool.query('SELECT id FROM slots WHERE modality=$1 AND date=$2 AND start_time=$3', ['personalizado', d, st]);
          if (check.rows.length === 0) { const r = await pool.query('INSERT INTO slots (modality,date,start_time,end_time,capacity) VALUES ($1,$2,$3,$4,$5) RETURNING *', ['personalizado', d, st, et, 2]); created.push(r.rows[0]); }
          else skipped.push({ modality: 'personalizado', date: d, start_time: st });
        }
      }
    }
    if (created.length === 0) return res.status(400).json({ error: 'Todos los horarios seleccionados ya existen.' });
    return res.status(201).json({ message: `${created.length} horarios creados`, created, skipped });
  } catch (e) { return res.status(500).json({ error: 'Error creating weekly slots', detail: e.message }); }
});

app.delete('/api/slots/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE slot_id = $1', [req.params.id]);
    const result = await pool.query('DELETE FROM slots WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Slot not found' });
    return res.json({ message: 'Slot deleted', slot: result.rows[0] });
  } catch (e) { return res.status(500).json({ error: 'Error deleting slot', detail: e.message }); }
});

app.put('/api/slots/:id/toggle-block', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('UPDATE slots SET is_blocked = NOT is_blocked WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Slot not found' });
    return res.json(result.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error toggling block', detail: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKINGS ROUTES
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; const { slot_id } = req.body;
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0];
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.available_classes <= 0) return res.status(400).json({ error: 'No tienes clases disponibles. Contacta al administrador.' });
    const slot = (await pool.query('SELECT * FROM slots WHERE id = $1', [slot_id])).rows[0];
    if (!slot) return res.status(404).json({ error: 'Horario no encontrado' });
    if (slot.is_blocked) return res.status(400).json({ error: 'Este horario está bloqueado' });
    const bookingsCount = (await pool.query('SELECT COUNT(*) FROM bookings WHERE slot_id = $1', [slot_id])).rows[0].count;
    if (parseInt(bookingsCount) >= slot.capacity) return res.status(400).json({ error: 'Este horario ya está lleno' });
    const existingBooking = await pool.query('SELECT id FROM bookings WHERE user_id = $1 AND slot_id = $2', [userId, slot_id]);
    if (existingBooking.rows.length > 0) return res.status(400).json({ error: 'Ya tienes una reserva en este horario' });
    const cancelToken = crypto.randomBytes(32).toString('hex');
    const booking = (await pool.query('INSERT INTO bookings (user_id, slot_id, cancel_token) VALUES ($1,$2,$3) RETURNING *', [userId, slot_id, cancelToken])).rows[0];
    await pool.query('UPDATE users SET available_classes = available_classes - 1 WHERE id = $1', [userId]);
    const dateFormatted = new Date(slot.date).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const cancelUrl = `https://zonaelitemarinilla.com/cancel?token=${cancelToken}`;
    await sendEmail(user.email, '✅ Reserva Confirmada - Zona Elite', '', `<h2>¡Reserva Confirmada!</h2><p><strong>Fecha:</strong> ${dateFormatted}</p><p><strong>Hora:</strong> ${formatTo12Hour(slot.start_time)} - ${formatTo12Hour(slot.end_time)}</p><p><strong>Modalidad:</strong> ${slot.modality}</p><p>Para cancelar: <a href="${cancelUrl}">Cancelar Reserva</a></p>`);
    await pool.query('INSERT INTO notifications (message, type) VALUES ($1, $2)', [`${user.name} reservó ${slot.modality} el ${dateFormatted} a las ${formatTo12Hour(slot.start_time)}`, 'booking']);
    return res.status(201).json({ message: 'Reserva creada exitosamente', booking });
  } catch (e) { console.error('Booking error:', e); return res.status(500).json({ error: 'Error al crear reserva', detail: e.message }); }
});

app.post('/api/bookings/admin', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { user_id, slot_id } = req.body;
    const cancelToken = crypto.randomBytes(32).toString('hex');
    const booking = (await pool.query('INSERT INTO bookings (user_id, slot_id, cancel_token) VALUES ($1,$2,$3) RETURNING *', [user_id, slot_id, cancelToken])).rows[0];
    await pool.query('UPDATE users SET available_classes = GREATEST(available_classes - 1, 0) WHERE id = $1', [user_id]);
    return res.status(201).json({ message: 'Reserva admin creada', booking });
  } catch (e) { return res.status(500).json({ error: 'Error al crear reserva admin', detail: e.message }); }
});

app.get('/api/bookings/my-bookings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT b.id AS booking_id, b.created_at AS booked_at, s.id AS slot_id, s.modality, s.date, s.start_time, s.end_time FROM bookings b JOIN slots s ON b.slot_id = s.id WHERE b.user_id = $1 ORDER BY s.date DESC, s.start_time DESC', [req.user.id]);
    return res.json(result.rows);
  } catch (e) { return res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/bookings/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT b.id AS booking_id, b.created_at AS booked_at, u.id AS user_id, u.name AS user_name, u.email AS user_email, s.id AS slot_id, s.modality, s.date, s.start_time, s.end_time FROM bookings b JOIN users u ON b.user_id = u.id JOIN slots s ON b.slot_id = s.id ORDER BY s.date DESC, s.start_time DESC');
    return res.json(result.rows);
  } catch (e) { return res.status(500).json({ error: 'Internal server error' }); }
});

app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const booking = (await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id])).rows[0];
    if (!booking) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    await pool.query('UPDATE users SET available_classes = available_classes + 1 WHERE id = $1', [booking.user_id]);
    return res.json({ message: 'Reserva cancelada exitosamente' });
  } catch (e) { return res.status(500).json({ error: 'Error al cancelar reserva', detail: e.message }); }
});

app.get('/api/bookings/token/:token', async (req, res) => {
  try {
    const result = await pool.query('SELECT b.*, s.modality, s.date, s.start_time, s.end_time, u.name AS user_name FROM bookings b JOIN slots s ON b.slot_id = s.id JOIN users u ON b.user_id = u.id WHERE b.cancel_token = $1', [req.params.token]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    return res.json(result.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/bookings/cancel-token', async (req, res) => {
  try {
    const { token } = req.body;
    const booking = (await pool.query('SELECT * FROM bookings WHERE cancel_token = $1', [token])).rows[0];
    if (!booking) return res.status(404).json({ error: 'Reserva no encontrada o ya fue cancelada' });
    await pool.query('DELETE FROM bookings WHERE id = $1', [booking.id]);
    await pool.query('UPDATE users SET available_classes = available_classes + 1 WHERE id = $1', [booking.user_id]);
    return res.json({ message: 'Reserva cancelada exitosamente' });
  } catch (e) { return res.status(500).json({ error: 'Error al cancelar reserva', detail: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USERS ROUTES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, phone, cedula, available_classes, plan_type, payment_method, payment_amount, payment_date, expiration_date, payment_status, created_at FROM users ORDER BY created_at DESC');
    return res.json(result.rows);
  } catch (e) { return res.status(500).json({ error: 'Failed to fetch users', detail: e.message }); }
});

app.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    let { name, email, phone, cedula, plan_type, payment_method, payment_amount, payment_date, expiration_date, payment_status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!email) email = `cliente_${Date.now()}@zonaelite.local`;
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(400).json({ error: 'Ya existe un usuario con este correo' });
    const result = await pool.query('INSERT INTO users (name,email,phone,cedula,role,is_verified,plan_type,payment_method,payment_amount,payment_date,expiration_date,payment_status) VALUES ($1,$2,$3,$4,$5,true,$6,$7,$8,$9,$10,$11) RETURNING *', [name, email, phone, cedula, 'client', plan_type||null, payment_method||'efectivo', payment_amount||0, payment_date||null, expiration_date||null, payment_status||'pendiente']);
    return res.status(201).json({ message: 'Usuario creado exitosamente', user: result.rows[0] });
  } catch (e) { return res.status(500).json({ error: 'Error creating user', detail: e.message }); }
});

app.put('/api/users/:id/classes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { available_classes, plan_type, payment_method, payment_amount, payment_date, expiration_date, payment_status } = req.body;
    const fields = []; const vals = []; let idx = 1;
    if (available_classes !== undefined) { fields.push(`available_classes = $${idx++}`); vals.push(available_classes); }
    if (plan_type !== undefined) { fields.push(`plan_type = $${idx++}`); vals.push(plan_type); }
    if (payment_method !== undefined) { fields.push(`payment_method = $${idx++}`); vals.push(payment_method); }
    if (payment_amount !== undefined) { fields.push(`payment_amount = $${idx++}`); vals.push(payment_amount); }
    if (payment_date !== undefined) { fields.push(`payment_date = $${idx++}`); vals.push(payment_date || null); }
    if (expiration_date !== undefined) { fields.push(`expiration_date = $${idx++}`); vals.push(expiration_date || null); }
    if (payment_status !== undefined) { fields.push(`payment_status = $${idx++}`); vals.push(payment_status); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.id);
    const result = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User updated', user: result.rows[0] });
  } catch (e) { return res.status(500).json({ error: 'Error updating user', detail: e.message }); }
});

app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE user_id = $1', [req.params.id]);
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted' });
  } catch (e) { return res.status(500).json({ error: 'Error deleting user', detail: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PLANS ROUTES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/plans', async (req, res) => {
  try { const r = await pool.query('SELECT * FROM plans ORDER BY id ASC'); return res.json(r.rows); }
  catch (e) { return res.status(500).json({ error: 'Internal server error', message: e.message, stack: e.stack }); }
});

app.post('/api/plans', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, default_classes, price, is_active, classes_per_week, sessions_per_month, modality_type } = req.body;
    const result = await pool.query('INSERT INTO plans (name,description,default_classes,price,is_active,classes_per_week,sessions_per_month,modality_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [name, description, default_classes||0, price||0, is_active!==false, classes_per_week||0, sessions_per_month||0, modality_type||'funcional']);
    return res.status(201).json(result.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error creating plan', detail: e.message }); }
});

app.put('/api/plans/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, default_classes, price, is_active, classes_per_week, sessions_per_month, modality_type } = req.body;
    const result = await pool.query('UPDATE plans SET name=$1,description=$2,default_classes=$3,price=$4,is_active=$5,classes_per_week=$6,sessions_per_month=$7,modality_type=$8 WHERE id=$9 RETURNING *', [name, description, default_classes, price, is_active, classes_per_week, sessions_per_month, modality_type, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
    return res.json(result.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error updating plan', detail: e.message }); }
});

app.delete('/api/plans/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM plans WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
    return res.json({ message: 'Plan deleted' });
  } catch (e) { return res.status(500).json({ error: 'Error deleting plan', detail: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS ROUTES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/notifications', authenticateToken, isAdmin, async (req, res) => {
  try { const r = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'); return res.json(r.rows); }
  catch (e) { return res.status(500).json({ error: 'Internal server error' }); }
});

app.put('/api/admin/notifications/:id/read', authenticateToken, isAdmin, async (req, res) => {
  try { await pool.query('UPDATE notifications SET read = true WHERE id = $1', [req.params.id]); return res.json({ message: 'Marked as read' }); }
  catch (e) { return res.status(500).json({ error: 'Internal server error' }); }
});

app.delete('/api/admin/notifications', authenticateToken, isAdmin, async (req, res) => {
  try { await pool.query('DELETE FROM notifications'); return res.json({ message: 'All notifications deleted' }); }
  catch (e) { return res.status(500).json({ error: 'Internal server error' }); }
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

export default app;
