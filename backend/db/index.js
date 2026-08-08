// The auth store moved from file-backed SQLite to Postgres so the API can run
// on serverless hosting, where the container filesystem is ephemeral and a
// .db file would be wiped on every deploy and cold start.
//
// This module stays as the public entry point — callers still `require('../db')`
// — but everything now delegates to db/postgres.js. Note that connect(),
// query() and friends are async; the old DatabaseSync API was synchronous.
//
// The previous SQLite implementation and schema.sql are kept in the repo for
// reference and for anyone running the stack on a host with a persistent disk.

module.exports = require('./postgres');
