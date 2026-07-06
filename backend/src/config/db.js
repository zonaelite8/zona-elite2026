const { Pool } = require('pg');
require('dotenv').config();

let connectionString = process.env.DATABASE_URL;

// Auto-fix para el pooler de Supabase (puerto 6543) que interrumpe migraciones
if (connectionString && connectionString.includes('supabase.co') && connectionString.includes(':6543')) {
  console.log("⚠️ Detectada conexión de Supabase en puerto de pooling (6543). Redirigiendo automáticamente al puerto directo (5432) para evitar desconexiones.");
  connectionString = connectionString.replace(':6543', ':5432');
}

const isProduction = process.env.NODE_ENV === 'production';
const isExternal = connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: (isProduction || isExternal) ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 15000, // Tiempo de espera para conectar
  idleTimeoutMillis: 30000, // Cerrar clientes inactivos
  max: 2, // Límite de conexiones simultáneas ultra-bajo para evitar saturación en planes gratuitos
  keepAlive: true // Mantener conexión viva en entornos cloud
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
  connect: () => pool.connect(),
  pool
};
