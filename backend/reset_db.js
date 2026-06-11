require('dotenv').config();
const db = require('./src/config/db');

async function resetDatabase() {
  try {
    console.log("Iniciando reseteo total de la base de datos...");

    // 1. Borrar todas las notificaciones
    await db.query('TRUNCATE TABLE notifications RESTART IDENTITY CASCADE');
    console.log("✅ Notificaciones borradas.");

    // 2. Borrar todas las reservas (bookings)
    await db.query('TRUNCATE TABLE bookings RESTART IDENTITY CASCADE');
    console.log("✅ Reservas borradas.");

    // 3. Borrar todos los horarios (slots) para dejar el calendario en blanco
    await db.query('TRUNCATE TABLE slots RESTART IDENTITY CASCADE');
    console.log("✅ Horarios y clases borrados.");

    // 4. Borrar todos los usuarios EXCEPT el administrador principal
    const deleteUsersResult = await db.query("DELETE FROM users WHERE email != 'zonaelite8@gmail.com'");
    console.log(`✅ ${deleteUsersResult.rowCount} usuarios de prueba borrados.`);
    
    // Dejar disponible las clases del admin en 0 por si acaso
    await db.query("UPDATE users SET available_classes = 0 WHERE email = 'zonaelite8@gmail.com'");

    console.log("\n🎉 BASE DE DATOS COMO NUEVA 🎉");
    console.log("Todo está limpio y listo para entregar al administrador.");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error reseteando la base de datos:", error);
    process.exit(1);
  }
}

resetDatabase();
