const db = require('./src/config/db');

async function addPlanType() {
  try {
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type VARCHAR(100) DEFAULT 'Sin Plan'");
    console.log('Column plan_type added successfully');
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

addPlanType();
