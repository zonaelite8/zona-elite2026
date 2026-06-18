const db = require('./src/config/db');
db.query("UPDATE users SET role = 'admin' WHERE email = 'zonaelite8@gmail.com'")
  .then(() => console.log('Role updated to admin'))
  .catch(console.error)
  .finally(() => process.exit(0));
