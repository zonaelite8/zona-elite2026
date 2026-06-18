const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database successfully.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Prueba la conexión de inmediato para mostrar el mensaje
pool.query('SELECT 1')
  .then(() => console.log('✅ Postgres conectado exitosamente.'))
  .catch(err => console.error('❌ Error conectando a Postgres. Verifica tus credenciales en el archivo .env:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
