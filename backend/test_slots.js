require('dotenv').config();
const db = require('./src/config/db');
db.query("SELECT date, start_time, modality FROM slots WHERE date >= '2026-07-14' ORDER BY date ASC, start_time ASC LIMIT 10")
  .then(res => {
    console.log(res.rows);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
