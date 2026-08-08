const fs = require('fs');
const path = require('path');

// Postgres connection for serverless.
//
// Two things matter in a serverless runtime that did not matter with SQLite:
//
//  1. Every warm invocation must reuse the same pool. A fresh Pool per request
//     exhausts Postgres connection slots almost immediately under any load, so
//     the pool is cached on globalThis — module scope alone is not enough,
//     since Vercel may re-evaluate modules within a single container.
//
//  2. Nothing here is synchronous. node:sqlite's DatabaseSync returned rows
//     directly; pg returns promises. Callers must await.
//
// Requires DATABASE_URL (Neon, Supabase, or Vercel Postgres).

const SCHEMA_PATH = path.join(__dirname, 'schema.postgres.sql');

// Reuse across warm invocations. Keyed on a symbol to avoid collisions.
const POOL_KEY = Symbol.for('realestate.pg.pool');

function getPool() {
  if (globalThis[POOL_KEY]) return globalThis[POOL_KEY];

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Provision a Postgres database (Neon/Supabase/Vercel Postgres) ' +
      'and set DATABASE_URL before starting the server.'
    );
  }

  const { Pool } = require('pg');

  globalThis[POOL_KEY] = new Pool({
    connectionString,
    // Serverless containers are short-lived and numerous; a large per-container
    // pool multiplies into hundreds of server-side connections. Keep it small
    // and let the provider's pooler (PgBouncer) do the fan-in.
    max: Number(process.env.PG_POOL_MAX) || 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    // Hosted Postgres terminates TLS at the pooler with certs that do not chain
    // to a public root. Skip local verification unless explicitly told not to.
    ssl: process.env.PGSSL_DISABLE === 'true' ? false : { rejectUnauthorized: false },
  });

  return globalThis[POOL_KEY];
}

/**
 * Run a parameterized query. Postgres uses $1/$2 placeholders, not SQLite's ?.
 * @returns {Promise<{rows: object[], rowCount: number}>}
 */
async function query(text, params = []) {
  return getPool().query(text, params);
}

/** First row, or null. Replaces SQLite's .get(). */
async function queryOne(text, params = []) {
  const { rows } = await query(text, params);
  return rows[0] || null;
}

/**
 * Apply schema.postgres.sql. Safe to call repeatedly — every statement is
 * IF NOT EXISTS. Run from the migrate script, not on each cold start: doing
 * DDL per invocation adds latency and races when containers start together.
 */
async function migrate() {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await query(sql);
  console.log('[DB] Postgres schema applied');
}

/**
 * Verify connectivity. Called once at boot on long-running hosts; skipped in
 * serverless, where the first real query surfaces any problem anyway.
 */
async function connect() {
  const row = await queryOne('SELECT 1 AS ok');
  if (!row?.ok) throw new Error('Postgres connectivity check failed');
  console.log('[DB] Connected to Postgres');
  return true;
}

async function close() {
  const pool = globalThis[POOL_KEY];
  if (pool) {
    await pool.end();
    globalThis[POOL_KEY] = undefined;
  }
}

module.exports = { query, queryOne, migrate, connect, close, getPool };
