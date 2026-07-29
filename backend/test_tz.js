require('dotenv').config();
const db = require('./src/config/db');
db.query("SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date as local_date")
  .then(res => {
    console.log("Local date:", res.rows[0].local_date);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
