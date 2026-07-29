const db = require('./config/db');
const bcrypt = require('bcryptjs');

let _initialized = false;

async function initializeDatabaseAndAdmin() {
  if (_initialized) return 'Already initialized';
  
  let client;
  let retries = 3;
  
  while (retries > 0) {
    try {
      client = await db.connect();
      await client.query('SET search_path TO public;');
      break;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  try {
    // UUID extension
    const extCheck = await client.query("SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'");
    if (extCheck.rows.length === 0) {
      try { await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'); } catch (e) { /* ok */ }
    }

    // Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL,
        default_classes INT DEFAULT 0, price DECIMAL(10, 2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL, email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255), google_id VARCHAR(255) UNIQUE,
        phone VARCHAR(20), cedula VARCHAR(50),
        role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'admin')),
        available_classes INT DEFAULT 0, plan_type VARCHAR(100) DEFAULT 'Sin Plan',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS available_classes INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS cedula VARCHAR(50),
      ADD COLUMN IF NOT EXISTS plan_type VARCHAR(100) DEFAULT 'Sin Plan',
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'efectivo',
      ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_date DATE,
      ADD COLUMN IF NOT EXISTS expiration_date DATE,
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pendiente',
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verify_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS slots (
        id SERIAL PRIMARY KEY,
        modality VARCHAR(50) NOT NULL CHECK (modality IN ('fuerza', 'personalizado')),
        date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL,
        capacity INT NOT NULL, is_blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_slot_time UNIQUE (modality, date, start_time)
      )
    `);
    await client.query('ALTER TABLE slots ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE');

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        slot_id INTEGER REFERENCES slots(id) ON DELETE CASCADE,
        evaluation JSONB DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        cancel_token VARCHAR(255),
        CONSTRAINT unique_user_booking UNIQUE (user_id, slot_id)
      )
    `);
    await client.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_token VARCHAR(255)');

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY, message TEXT NOT NULL, type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id)');

    // Admin user
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Zonaelite2026.', salt);
    const adminCheck = await client.query("SELECT id FROM users WHERE email = 'zonaelite8@gmail.com'");
    if (adminCheck.rows.length === 0) {
      await client.query("INSERT INTO users (name, email, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, true)", ['Administrador', 'zonaelite8@gmail.com', hash, 'admin']);
    } else {
      await client.query("UPDATE users SET password_hash = $1, is_verified = true WHERE email = 'zonaelite8@gmail.com'", [hash]);
    }

    // Plans
    await client.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS description TEXT, ADD COLUMN IF NOT EXISTS classes_per_week INT DEFAULT 0, ADD COLUMN IF NOT EXISTS sessions_per_month INT DEFAULT 0, ADD COLUMN IF NOT EXISTS modality_type VARCHAR(50) DEFAULT 'funcional'`);
    
    const officialPlans = [
      ['Entrenamiento Funcional - Plan Básico', 'Entrenamiento semipersonalizado con máximo 5 personas.', 3, 12, 'funcional', 12, 170000, true],
      ['Entrenamiento Funcional - Plan Avanzado', 'Entrenamiento semipersonalizado con máximo 5 personas.', 5, 20, 'funcional', 20, 230000, true],
      ['Plan Élite Básico (Deportistas)', 'Entrenamiento 100% personalizado, enfocado a la necesidad específica de cada deportista.', 1, 4, 'personalizado', 4, 160000, true],
      ['Plan Élite Avanzado', 'Entrenamiento 100% personalizado, enfocado a la necesidad específica del deportista.', 2, 8, 'personalizado', 8, 280000, true]
    ];

    for (const p of officialPlans) {
      await client.query(`INSERT INTO plans (name, description, classes_per_week, sessions_per_month, modality_type, default_classes, price, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price`, p);
    }

    _initialized = true;
    if (client) client.release();
    return 'OK';
  } catch (error) {
    if (client) client.release();
    throw error;
  }
}

module.exports = { initializeDatabaseAndAdmin };
