require('dotenv').config();
const fs = require('fs');
const db = require('./src/config/db');

const sql = fs.readFileSync('./migration_plans.sql', 'utf8');

db.query(sql).then(res => {
  console.log("Migración ejecutada con éxito!");
  process.exit(0);
}).catch(err => {
  console.error("Error ejecutando migración:", err);
  process.exit(1);
});
