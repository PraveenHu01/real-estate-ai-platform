// Long-running entry point: local dev, Render, Fly, or any host with a real
// process. Vercel does not use this file — see api/index.js.
//
// All app wiring lives in app.js so the two entry points cannot drift.

const { app } = require('./app');
const { connect } = require('./db');

const PORT = process.env.PORT || 5000;

(async () => {
  // Fail fast on a bad DATABASE_URL rather than surfacing it as a 500 on the
  // first login attempt. Serverless skips this — there the first query reports it.
  try {
    await connect();
  } catch (err) {
    console.error('\n[FATAL] Could not reach Postgres:', err.message);
    console.error('Set DATABASE_URL, then run: npm run db:migrate\n');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`  Real Estate AI Platform Backend on port ${PORT}`);
    console.log(`  Health: http://localhost:${PORT}/api/health`);
    console.log(`  Auth:   Postgres + Argon2id + JWT cookies`);
    console.log('====================================================');
  });
})();
