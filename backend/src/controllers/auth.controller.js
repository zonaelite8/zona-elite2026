const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const { sendEmail } = require('../services/email.service');
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token helper
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, cedula: user.cedula },
    process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
    { expiresIn: '7d' }
  );
};

// Register Standard User
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    // Check if user already exists
    const userExist = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate 6-digit verification code
    const verifyToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert user (default role is client unless specified)
    const userRole = role === 'admin' ? 'admin' : 'client';
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role, is_verified, verify_token) VALUES ($1, $2, $3, $4, false, $5) RETURNING id, name, email, role, phone, cedula',
      [name, email, passwordHash, userRole, verifyToken]
    );

    const user = result.rows[0];

    // Send verification email
    const emailHtml = `
      <h2>¡Bienvenido a Zona Élite, ${name}!</h2>
      <p>Para activar tu cuenta y poder agendar tus entrenamientos, ingresa el siguiente código en la página web:</p>
      <div style="background:#f4f4f5;padding:20px;border-radius:10px;text-align:center;margin:20px 0;">
        <span style="font-size:32px;font-weight:bold;letter-spacing:5px;color:#f5b927;background:#18181b;padding:10px 20px;border-radius:8px;">${verifyToken}</span>
      </div>
      <p>Este código es confidencial. Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
    // Send verification email in the background
    sendEmail(email, 'Verifica tu cuenta - Zona Élite', 'Haz clic en el enlace para verificar tu cuenta', emailHtml);

    return res.status(210).json({
      message: 'User registered successfully',
      needsVerification: true
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Login Standard User
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        cedula: user.cedula
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Google OAuth Sign-In / Sign-Up
const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'ID token is required' });
  }

  try {
    // Verify ID Token via Google OAuth client
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // Check if user exists by Google ID or by email
    let userResult = await db.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email]);
    let user = userResult.rows[0];

    if (!user) {
      // Create user if not registered
      const insertResult = await db.query(
        'INSERT INTO users (name, email, google_id, role, is_verified) VALUES ($1, $2, $3, $4, true) RETURNING id, name, email, role, phone, cedula',
        [name, email, googleId, 'client'] // Default Google users are clients
      );
      user = insertResult.rows[0];
    } else if (!user.google_id) {
      // If user registered with email first, link Google ID
      const updateResult = await db.query(
        'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING id, name, email, role, phone, cedula',
        [googleId, user.id]
      );
      user = updateResult.rows[0];
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        cedula: user.cedula
      }
    });
  } catch (error) {
    console.error('Error verifying Google Token:', error);
    return res.status(401).json({ error: 'Google authentication failed' });
  }
};

// Update Profile (Phone, Cedula, Name)
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, phone, cedula } = req.body;

  try {
    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), cedula = COALESCE($3, cedula) WHERE id = $4 RETURNING id, name, email, role, phone, cedula',
      [name, phone, cedula, userId]
    );
    
    const user = result.rows[0];
    const token = generateToken(user);
    
    return res.json({
      message: 'Profile updated successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        cedula: user.cedula
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify Code Endpoint (replaces verifyEmail)
const verifyCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Correo y código son requeridos' });
  }

  try {
    const result = await db.query('UPDATE users SET is_verified = true, verify_token = NULL WHERE email = $1 AND verify_token = $2 RETURNING id, name, email, role, phone, cedula', [email, code]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Código incorrecto o cuenta ya verificada' });
    }
    
    const user = result.rows[0];
    const token = generateToken(user);

    return res.json({ 
      message: 'Cuenta verificada exitosamente',
      token,
      user
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  updateProfile,
  verifyCode
};
