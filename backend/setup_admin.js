require('dotenv').config();
const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function initializeDatabaseAndAdmin(shouldExit = true) {
  try {
    console.log("Iniciando inicialización de la base de datos...");

    // 1. Crear extension UUID
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log("Extension 'uuid-ossp' habilitada.");

    // 2. Crear tabla plans
    await db.query(`
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
    await db.query(`
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
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS available_classes INT DEFAULT 0');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS cedula VARCHAR(50)');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type VARCHAR(100) DEFAULT \'Sin Plan\'');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT \'efectivo\'');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token VARCHAR(255)');
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
        is_blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_slot_time UNIQUE (modality, date, start_time)
      )
    `);
    await db.query('ALTER TABLE slots ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE');
    console.log("Tabla 'slots' verificada.");

    // 4. Crear tabla bookings
    await db.query(`
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
    const hash = await bcrypt.hash('Zonaelite2026.', salt);

    const adminCheck = await db.query("SELECT id FROM users WHERE email = 'zonaelite8@gmail.com'");
    if (adminCheck.rows.length === 0) {
      await db.query(
        "INSERT INTO users (name, email, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, true)",
        ['Administrador', 'zonaelite8@gmail.com', hash, 'admin']
      );
      console.log("✅ Usuario administrador creado: zonaelite8@gmail.com / Zonaelite2026.");
    } else {
      await db.query(
        "UPDATE users SET password_hash = $1, is_verified = true WHERE email = 'zonaelite8@gmail.com'",
        [hash]
      );
      console.log("✅ Contraseña de administrador actualizada a 'Zonaelite2026.'");
    }

    // 8. Seed de planes por defecto
    await db.query('ALTER TABLE plans ADD COLUMN IF NOT EXISTS description TEXT');
    await db.query('ALTER TABLE plans ADD COLUMN IF NOT EXISTS classes_per_week INT DEFAULT 0');
    await db.query('ALTER TABLE plans ADD COLUMN IF NOT EXISTS sessions_per_month INT DEFAULT 0');
    await db.query('ALTER TABLE plans ADD COLUMN IF NOT EXISTS modality_type VARCHAR(50) DEFAULT \'funcional\'');
    
    const plansCountQuery = await db.query('SELECT COUNT(*) FROM plans');
    const plansCount = parseInt(plansCountQuery.rows[0].count, 10);
    // Si todavía hay planes genéricos viejos o no hay planes, los borramos e insertamos los oficiales
    const hasOldPlans = await db.query("SELECT id FROM plans WHERE name = 'Plan 12 Clases' OR name = 'Sin Plan'");
    if (plansCount === 0 || hasOldPlans.rows.length > 0) {
      await db.query('DELETE FROM plans');
      await db.query(`
        INSERT INTO plans (name, description, classes_per_week, sessions_per_month, modality_type, default_classes, price, is_active)
        VALUES 
        ('Entrenamiento Funcional - Plan Básico', 'Entrenamiento semipersonalizado con máximo 5 personas.', 3, 12, 'funcional', 12, 170000, true),
        ('Entrenamiento Funcional - Plan Avanzado', 'Entrenamiento semipersonalizado con máximo 5 personas.', 5, 20, 'funcional', 20, 230000, true),
        ('Plan Élite Básico (Deportistas)', 'Entrenamiento 100% personalizado, enfocado a la necesidad específica de cada deportista.', 1, 4, 'personalizado', 4, 160000, true),
        ('Plan Élite Avanzado', 'Entrenamiento 100% personalizado, enfocado a la necesidad específica del deportista.', 2, 8, 'personalizado', 8, 280000, true)
      `);
      console.log("Se insertaron los 4 planes oficiales.");
    }

    // 9. Seed de slots por defecto si la tabla está vacía
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
