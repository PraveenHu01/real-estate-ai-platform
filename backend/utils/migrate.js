// Apply the Postgres schema. Run once per environment before first boot:
//   npm run db:migrate
//
// Safe to re-run — every statement in schema.postgres.sql is IF NOT EXISTS.
// Kept out of the request path deliberately: running DDL on each cold start
// adds latency and races when several containers start at once.

require('dotenv').config();

const { migrate, connect, close } = require('../db');

(async () => {
  try {
    await connect();
    await migrate();
    console.log('[migrate] Schema is up to date.');
    await close();
    process.exit(0);
  } catch (err) {
    console.error('[migrate] Failed:', err.message);
    if (/DATABASE_URL/.test(err.message)) {
      console.error(
        '\nProvision a Postgres database and set DATABASE_URL, e.g.\n' +
        '  DATABASE_URL=postgresql://user:pass@host/db?sslmode=require\n' +
        'Neon (neon.tech) and Supabase both have a free tier that works here.\n'
      );
    }
    process.exit(1);
  }
})();
