require('dotenv').config();
const db = require('./src/config/db');
db.query("SELECT * FROM users WHERE role = 'admin'").then(res => {
  console.log(res.rows);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
