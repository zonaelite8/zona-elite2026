require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://admin:NiwDbgoKmMIOQrwlAyw1NuORFCWQqJCY@dpg-d8d748f40ujc73cc9it0-a.ohio-postgres.render.com/zona_elite',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000
});

client.connect()
  .then(() => client.query('SELECT COUNT(*) FROM pg_tables WHERE schemaname=\'public\''))
  .then(r => {
    console.log('Conexion exitosa! Tablas en BD:', r.rows[0].count);
    return client.end();
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error conectando:', err.message, err.code);
    process.exit(1);
  });
