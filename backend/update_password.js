const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function updatePassword() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Zonaelite2026.', salt);
    await db.query("UPDATE users SET password_hash = $1 WHERE email = 'zonaelite8@gmail.com'", [hash]);
    console.log('Password updated successfully');
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

updatePassword();
