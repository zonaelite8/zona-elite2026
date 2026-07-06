require('dotenv').config();
const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function initializeDatabaseAndAdmin(shouldExit = true) {
  let client;
  let retries = 3;
  
  while (retries > 0) {
    try {
      client = await db.connect();
      console.log("Conectado a la base de datos. Iniciando inicialización...");
      await client.query('SET search_path TO public;');
      break;
    } catch (err) {
      retries--;
      console.error(`Error conectando a la base de datos (intentos restantes: ${retries}):`, err.message);
      if (retries === 0) {
        if (shouldExit) process.exit(1);
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  try {
    // 1. Crear extension UUID (Solo si no existe para evitar problemas de permisos/PgBouncer)
    const extCheck = await client.query("SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'");
    if (extCheck.rows.length === 0) {
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log("Extension 'uuid-ossp' habilitada.");
      } catch (e) {
        console.warn("No se pudo crear la extensión 'uuid-ossp' (puede requerir privilegios de superusuario). Continuando... Error:", e.message);
      }
    } else {
      console.log("Extension 'uuid-ossp' ya está activa.");
    }

    // 2. Crear tabla plans
    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        default_classes INT DEFAULT 0,
        price DECIMAL(10, 2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabla 'plans' verificada.");

    // 3. Crear tabla users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        cedula VARCHAR(50),
        role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'admin')),
        available_classes INT DEFAULT 0,
        plan_type VARCHAR(100) DEFAULT 'Sin Plan',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Modificar tabla users en una sola consulta
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
    console.log("Tabla 'users' verificada y columnas sincronizadas.");

    // 4. Crear tabla slots
    await client.query(`
      CREATE TABLE IF NOT EXISTS slots (
        id SERIAL PRIMARY KEY,
        modality VARCHAR(50) NOT NULL CHECK (modality IN ('fuerza', 'personalizado')),
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        capacity INT NOT NULL,
        is_blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_slot_time UNIQUE (modality, date, start_time)
      )
    `);
    await client.query('ALTER TABLE slots ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE');
    console.log("Tabla 'slots' verificada.");

    // 5. Crear tabla bookings
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
    // Ensure cancel_token column exists (migration for existing DBs)
    await client.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_token VARCHAR(255)');
    console.log("Tabla 'bookings' verificada.");

    // 6. Crear tabla notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabla 'notifications' verificada.");

    // 7. Crear índices
    await client.query('CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id)');
    console.log("Índices verificados.");

    // 8. Insertar/Actualizar Administrador
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Zonaelite2026.', salt);

    const adminCheck = await client.query("SELECT id FROM users WHERE email = 'zonaelite8@gmail.com'");
    if (adminCheck.rows.length === 0) {
      await client.query(
        "INSERT INTO users (name, email, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, true)",
        ['Administrador', 'zonaelite8@gmail.com', hash, 'admin']
      );
      console.log("✅ Usuario administrador creado: zonaelite8@gmail.com / Zonaelite2026.");
    } else {
      await client.query(
        "UPDATE users SET password_hash = $1, is_verified = true WHERE email = 'zonaelite8@gmail.com'",
        [hash]
      );
      console.log("✅ Contraseña de administrador actualizada a 'Zonaelite2026.'");
    }

    // 9. Seed de planes por defecto
    await client.query(`
      ALTER TABLE plans 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS classes_per_week INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sessions_per_month INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS modality_type VARCHAR(50) DEFAULT 'funcional'
    `);
    
    const officialPlans = [
      ['Entrenamiento Funcional - Plan Básico', 'Entrenamiento semipersonalizado con máximo 5 personas.', 3, 12, 'funcional', 12, 170000, true],
      ['Entrenamiento Funcional - Plan Avanzado', 'Entrenamiento semipersonalizado con máximo 5 personas.', 5, 20, 'funcional', 20, 230000, true],
      ['Plan Élite Básico (Deportistas)', 'Entrenamiento 100% personalizado, enfocado a la necesidad específica de cada deportista.', 1, 4, 'personalizado', 4, 160000, true],
      ['Plan Élite Avanzado', 'Entrenamiento 100% personalizado, enfocado a la necesidad específica del deportista.', 2, 8, 'personalizado', 8, 280000, true]
    ];

    for (const p of officialPlans) {
      await client.query(`
        INSERT INTO plans (name, description, classes_per_week, sessions_per_month, modality_type, default_classes, price, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price
      `, p);
    }
    console.log("Planes oficiales verificados e insertados/actualizados.");

    // 10. Seed de slots por defecto si la tabla está vacía
    const slotsCountQuery = await client.query('SELECT COUNT(*) FROM slots');
    const slotsCount = parseInt(slotsCountQuery.rows[0].count, 10);
    if (slotsCount === 0) {
      await client.query(`
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
    if (client) client.release();
    if (shouldExit) process.exit(0);
    return "Base de datos inicializada y administrador creado/actualizado con éxito.";
  } catch (error) {
    if (client) client.release();
    console.error("❌ Error inicializando base de datos y administrador:", error);
    if (shouldExit) process.exit(1);
    throw error;
  }
}

if (require.main === module) {
  initializeDatabaseAndAdmin(true);
}

module.exports = { initializeDatabaseAndAdmin };
