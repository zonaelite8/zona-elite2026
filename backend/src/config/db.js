const { Pool } = require('pg');
require('dotenv').config();

let connectionString = process.env.DATABASE_URL;

// Auto-fix para el pooler de Supabase (puerto 6543) que interrumpe migraciones DDL
if (connectionString && connectionString.includes('supabase.co') && connectionString.includes(':6543')) {
  connectionString = connectionString.replace(':6543', ':5432');
}

// Render fix: el hostname interno "dpg-xxx" solo resuelve dentro de la red interna de Render.
// Si existe EXTERNAL_DATABASE_URL, usarla como respaldo.
if (connectionString) {
  try {
    const hostMatch = connectionString.match(/@([^:/]+)/);
    if (hostMatch) {
      const host = hostMatch[1];
      if (host.startsWith('dpg-') && !host.includes('.') && process.env.EXTERNAL_DATABASE_URL) {
        console.log('⚠️ Usando EXTERNAL_DATABASE_URL como respaldo para hostname interno de Render.');
        connectionString = process.env.EXTERNAL_DATABASE_URL;
      }
    }
  } catch(e) { /* ignore */ }
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
});

// Log connections pero NO matar el proceso en errores de clientes inactivos
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database successfully.');
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
