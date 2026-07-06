const { Pool } = require('pg');
require('dotenv').config();

let connectionString = process.env.DATABASE_URL;

// Auto-fix para el pooler de Supabase (puerto 6543) que interrumpe migraciones DDL
if (connectionString && connectionString.includes('supabase.co') && connectionString.includes(':6543')) {
  connectionString = connectionString.replace(':6543', ':5432');
}

// Fix critico: el hostname interno de Render "dpg-d8h4mva8pkls73bvm980-a" no resuelve DNS.
// Reemplazamos con la URL externa correcta de la base de datos.
if (connectionString && connectionString.includes('dpg-d8h4mva8pkls73bvm980-a')) {
  console.log('⚠️ Auto-fix: Reemplazando hostname interno de Render con URL externa correcta.');
  connectionString = 'postgresql://admin:NiwDbgoKmMIOQrwlAyw1NuORFCWQqJCY@dpg-d8d748f40ujc73cc9it0-a.ohio-postgres.render.com/zona_elite';
}

// Render fix: Si existe EXTERNAL_DATABASE_URL, usarla como respaldo.
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

let isInternalRender = false;
if (connectionString) {
  try {
    const hostMatch = connectionString.match(/@([^:/]+)/);
    if (hostMatch) {
      const host = hostMatch[1];
      if (host.startsWith('dpg-') && !host.includes('.')) {
        isInternalRender = true;
      }
    }
  } catch(e) { /* ignore */ }
}

const pool = new Pool({
  connectionString,
  ssl: (isExternal && !isInternalRender) ? { rejectUnauthorized: false } : false,
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
