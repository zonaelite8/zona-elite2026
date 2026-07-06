const { Pool } = require('pg');
require('dotenv').config();

let connectionString = process.env.DATABASE_URL;

// Auto-fix para el pooler de Supabase (puerto 6543) que interrumpe migraciones DDL
if (connectionString && connectionString.includes('supabase.co') && connectionString.includes(':6543')) {
  connectionString = connectionString.replace(':6543', ':5432');
}

// Fix critico: Render pone hostname INTERNO en DATABASE_URL (sin .render.com).
// Esto falla si el servicio backend no está en la misma red. 
// Solución: agregar el sufijo externo dinámicamente.
if (connectionString) {
  try {
    const urlObj = new URL(connectionString);
    if (urlObj.hostname.startsWith('dpg-') && !urlObj.hostname.includes('.')) {
      console.log(`⚠️ Auto-fix: Convirtiendo hostname interno de Render a externo: ${urlObj.hostname} → ${urlObj.hostname}.ohio-postgres.render.com`);
      urlObj.hostname = `${urlObj.hostname}.ohio-postgres.render.com`;
      connectionString = urlObj.toString();
    }
  } catch (e) {
    // Fallback con regex si URL() falla
    const hostMatch = connectionString.match(/@([^:/]+)/);
    if (hostMatch) {
      const host = hostMatch[1];
      if (host.startsWith('dpg-') && !host.includes('.')) {
        console.log(`⚠️ Auto-fix (regex): Convirtiendo hostname interno a externo: ${host}`);
        connectionString = connectionString.replace('@' + host, '@' + host + '.ohio-postgres.render.com');
      }
    }
  }
}

const isExternal = connectionString &&
  !connectionString.includes('localhost') &&
  !connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: isExternal ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 60000,
  max: 5,
  allowExitOnIdle: false
});// Log connections y forzar search_path a 'public' para compatibilidad con poolers (PgBouncer)
pool.on('connect', (client) => {
  console.log('Connected to the PostgreSQL database successfully.');
  client.query('SET search_path TO public;').catch(err => {
    console.error('Error setting search_path on connect:', err.message);
  });
});
pool.on('error', (err) => {
  console.error('Idle client error (non-fatal):', err.message);
  // NO process.exit() aqui — dejamos que el pool se recupere solo
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  pool
};
