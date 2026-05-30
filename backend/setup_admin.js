require('dotenv').config();
const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function setAdminPassword() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    
    // Asignar contraseña al admin
    await db.query(
      "UPDATE users SET password_hash = $1 WHERE email = 'admin@zonaelite.com'",
      [hash]
    );
    console.log("Contraseña de administrador actualizada a 'admin123'");
    
    // Crear tabla notifications si no existe
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabla 'notifications' creada/verificada.");
    
    process.exit(0);
  } catch (error) {
    console.error("Error configurando admin y BD:", error);
    process.exit(1);
  }
}

setAdminPassword();
