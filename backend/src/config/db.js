const { Pool } = require('pg');
require('dotenv').config();

let connectionString = process.env.DATABASE_URL;

// Auto-fix para el pooler de Supabase (puerto 6543) que interrumpe migraciones DDL
if (connectionString && connectionString.includes('supabase.co') && connectionString.includes(':6543')) {
  connectionString = connectionString.replace(':6543', ':5432');
}

// Render fix: Si existe EXTERNAL_DATABASE_URL y la actual es interna, usarla preferentemente.
if (connectionString) {
  try {
    const hostMatch = connectionString.match(/@([^:/]+)/);
    if (hostMatch) {
      const host = hostMatch[1];
      if (host.startsWith('dpg-') && !host.includes('.') && process.env.EXTERNAL_DATABASE_URL) {
        console.log('⚠️ Usando EXTERNAL_DATABASE_URL para hostname interno de Render.');
        connectionString = process.env.EXTERNAL_DATABASE_URL;
      }
    }
  } catch(e) { /* ignore */ }
}

// Fix critico: el hostname interno de Render (ej: "dpg-d8d748f40ujc73cc9it0-a") a veces no resuelve DNS
// o da error de conexión. Lo reemplazamos dinámicamente con su versión externa.
if (connectionString) {
  try {
    const urlObj = new URL(connectionString);
    if (urlObj.hostname.startsWith('dpg-') && !urlObj.hostname.includes('.')) {
      console.log(`⚠️ Auto-fix: Reemplazando hostname interno de Render (${urlObj.hostname}) con la versión externa.`);
      urlObj.hostname = `${urlObj.hostname}.ohio-postgres.render.com`;
      connectionString = urlObj.toString();
    }
  } catch (e) {
    const hostMatch = connectionString.match(/@([^:/]+)/);
    if (hostMatch) {
      const host = hostMatch[1];
      if (host.startsWith('dpg-') && !host.includes('.')) {
        console.log(`⚠️ Auto-fix (regex): Reemplazando hostname interno de Render (${host}) con la versión externa.`);
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
