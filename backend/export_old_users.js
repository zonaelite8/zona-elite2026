require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

// La cadena de conexión de la BD anterior con hostname externo
const OLD_DB_URL = 'postgresql://admin:NiwDbgoKmMIOQrwlAyw1NuORFCWQqJCY@dpg-d8d748f40ujc73cc9it0-a.ohio-postgres.render.com/zona_elite';

const pool = new Pool({
  connectionString: OLD_DB_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function exportUsers() {
  let client;
  try {
    console.log('🔌 Conectando a la base de datos anterior...');
    client = await pool.connect();
    console.log('✅ Conectado exitosamente!\n');

    // Obtener todos los usuarios
    const result = await client.query(`
      SELECT 
        id, name, email, phone, cedula, role,
        available_classes, plan_type, payment_method,
        payment_amount, payment_date, expiration_date,
        payment_status, is_verified, created_at
      FROM users
      ORDER BY created_at ASC
    `);

    console.log(`📊 Encontrados ${result.rows.length} usuarios:\n`);
    console.log('='.repeat(60));
    
    result.rows.forEach((u, i) => {
      console.log(`[${i+1}] ${u.name} | ${u.email} | ${u.role} | Plan: ${u.plan_type} | Clases: ${u.available_classes}`);
    });

    console.log('='.repeat(60));

    // Generar SQL de inserción para la nueva BD
    let sql = `-- Migración de usuarios desde base de datos anterior\n`;
    sql += `-- Generado el: ${new Date().toISOString()}\n`;
    sql += `-- Total usuarios: ${result.rows.length}\n\n`;

    for (const u of result.rows) {
      const name = (u.name || '').replace(/'/g, "''");
      const email = (u.email || '').replace(/'/g, "''");
      const phone = u.phone ? `'${u.phone.replace(/'/g, "''")}'` : 'NULL';
      const cedula = u.cedula ? `'${u.cedula.replace(/'/g, "''")}'` : 'NULL';
      const role = u.role || 'client';
      const availableClasses = u.available_classes || 0;
      const planType = (u.plan_type || 'Sin Plan').replace(/'/g, "''");
      const paymentMethod = u.payment_method || 'efectivo';
      const paymentAmount = u.payment_amount || 0;
      const paymentDate = u.payment_date ? `'${u.payment_date.toISOString().split('T')[0]}'` : 'NULL';
      const expirationDate = u.expiration_date ? `'${u.expiration_date.toISOString().split('T')[0]}'` : 'NULL';
      const paymentStatus = u.payment_status || 'pendiente';
      const isVerified = u.is_verified ? 'true' : 'false';

      // Nota: password_hash se pone NULL, el admin puede resetear contraseñas
      sql += `INSERT INTO users (name, email, phone, cedula, role, available_classes, plan_type, payment_method, payment_amount, payment_date, expiration_date, payment_status, is_verified)\n`;
      sql += `VALUES ('${name}', '${email}', ${phone}, ${cedula}, '${role}', ${availableClasses}, '${planType}', '${paymentMethod}', ${paymentAmount}, ${paymentDate}, ${expirationDate}, '${paymentStatus}', ${isVerified})\n`;
      sql += `ON CONFLICT (email) DO UPDATE SET\n`;
      sql += `  name = EXCLUDED.name,\n`;
      sql += `  phone = EXCLUDED.phone,\n`;
      sql += `  plan_type = EXCLUDED.plan_type,\n`;
      sql += `  available_classes = EXCLUDED.available_classes,\n`;
      sql += `  payment_status = EXCLUDED.payment_status;\n\n`;
    }

    // Guardar el SQL generado
    fs.writeFileSync('./users_migration.sql', sql, 'utf8');
    console.log('\n✅ Archivo "users_migration.sql" generado exitosamente!');
    console.log('📂 Puedes encontrarlo en la carpeta backend/');
    console.log('\n⚠️  NOTA: Las contraseñas no se migraron por seguridad.');
    console.log('   Los usuarios necesitarán usar "Olvidé mi contraseña" para acceder.');

  } catch (err) {
    console.error('\n❌ Error al conectar:', err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout') || err.message.includes('ENOTFOUND')) {
      console.log('\n💡 La base de datos de Render ya fue eliminada (plan gratuito expira a los 90 días).');
      console.log('   No es posible recuperar los datos automáticamente.');
      console.log('   Opciones:');
      console.log('   1. Ingresar los usuarios manualmente');
      console.log('   2. Usar el CSV que mencionaste anteriormente');
    }
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

exportUsers();
