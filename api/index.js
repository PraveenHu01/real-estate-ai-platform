// Vercel serverless entry point.
//
// Vercel routes every /api/* request here (see the rewrite in vercel.json) and
// invokes the exported handler. Express apps are valid Node request handlers,
// so the app is exported directly — no adapter needed.
//
// Deliberately absent:
//   - app.listen(). Vercel owns the socket; binding a port here would hang.
//   - schema migration. DDL on cold start adds latency and races across
//     containers. Run `npm run db:migrate` once from your machine instead.

const { app } = require('../backend/app');

module.exports = app;
