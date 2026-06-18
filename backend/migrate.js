const db = require('./src/config/db');
db.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_token VARCHAR(255)")
.then(()=>console.log('Done'))
.catch(console.error)
.finally(()=>process.exit(0));
