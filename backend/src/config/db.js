const { Pool } = require('pg');
require('dotenv').config();

let connectionString = process.env.DATABASE_URL;

// Auto-fix para el pooler de Supabase (puerto 6543) que interrumpe migraciones DDL
if (connectionString && connectionString.includes('supabase.co') && connectionString.includes(':6543')) {
  connectionString = connectionString.replace(':6543', ':5432');
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
