// Seed all catalogue and curated properties into Neon Postgres
require('dotenv').config();

const { connect, close } = require('../db');
const { insertProperty, countProperties } = require('../db/properties');
const { initialProperties } = require('./seedData');

async function seedProperties() {
  try {
    await connect();
    const existing = await countProperties();
    console.log(`[seed:properties] Current properties in Neon: ${existing}`);

    if (existing >= initialProperties.length) {
      console.log(`[seed:properties] Already populated (${existing} listings). Skipping.`);
      return;
    }

    console.log(`[seed:properties] Inserting ${initialProperties.length} listings into Neon PostgreSQL...`);
    let inserted = 0;
    for (const prop of initialProperties) {
      await insertProperty(prop);
      inserted++;
    }

    console.log(`[seed:properties] Successfully migrated and stored ${inserted} properties in Neon Postgres!`);
  } catch (err) {
    console.error('[seed:properties] Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedProperties()
    .then(() => close())
    .then(() => process.exit(0));
}

module.exports = { seedProperties };
