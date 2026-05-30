require('dotenv').config();
const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function initializeDatabaseAndAdmin(shouldExit = true) {
  try {
    console.log("Iniciando inicialización de la base de datos...");

    // 1. Crear extension UUID
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log("Extension 'uuid-ossp' habilitada.");

    // 2. Crear tabla users
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'admin')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabla 'users' verificada.");

    // 3. Crear tabla slots
    await db.query(`
      CREATE TABLE IF NOT EXISTS slots (
        id SERIAL PRIMARY KEY,
        modality VARCHAR(50) NOT NULL CHECK (modality IN ('fuerza', 'personalizado')),
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        capacity INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_slot_time UNIQUE (modality, date, start_time)
      )
    `);
    console.log("Tabla 'slots' verificada.");

    // 4. Crear tabla bookings
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        slot_id INT REFERENCES slots(id) ON DELETE CASCADE,
        evaluation JSONB DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_booking UNIQUE (user_id, slot_id)
      )
    `);
    console.log("Tabla 'bookings' verificada.");

    // 5. Crear tabla notifications
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabla 'notifications' verificada.");

    // 6. Crear índices
    await db.query('CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id)');
    console.log("Índices verificados.");

    // 7. Insertar/Actualizar Administrador
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);

    const adminCheck = await db.query("SELECT id FROM users WHERE email = 'admin@zonaelite.com'");
    if (adminCheck.rows.length === 0) {
      await db.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
        ['Administrador', 'admin@zonaelite.com', hash, 'admin']
      );
      console.log("✅ Usuario administrador creado: admin@zonaelite.com / admin123");
    } else {
      await db.query(
        "UPDATE users SET password_hash = $1 WHERE email = 'admin@zonaelite.com'",
        [hash]
      );
      console.log("✅ Contraseña de administrador actualizada a 'admin123'");
    }

    // 8. Seed de slots por defecto si la tabla está vacía
    const slotsCountQuery = await db.query('SELECT COUNT(*) FROM slots');
    const slotsCount = parseInt(slotsCountQuery.rows[0].count, 10);
    if (slotsCount === 0) {
      await db.query(`
        INSERT INTO slots (modality, date, start_time, end_time, capacity)
        VALUES 
        ('fuerza', CURRENT_DATE, '08:00:00', '09:00:00', 5),
        ('fuerza', CURRENT_DATE, '09:00:00', '10:00:00', 5),
        ('personalizado', CURRENT_DATE, '10:00:00', '11:00:00', 2),
        ('personalizado', CURRENT_DATE, '11:00:00', '12:00:00', 2)
      `);
      console.log("Se insertaron horarios de prueba por defecto.");
    }

    console.log("🎉 Inicialización de base de datos completada exitosamente.");
    if (shouldExit) process.exit(0);
    return "Base de datos inicializada y administrador creado/actualizado con éxito.";
  } catch (error) {
    console.error("❌ Error inicializando base de datos y administrador:", error);
    if (shouldExit) process.exit(1);
    throw error;
  }
}

if (require.main === module) {
  initializeDatabaseAndAdmin(true);
}

module.exports = { initializeDatabaseAndAdmin };
