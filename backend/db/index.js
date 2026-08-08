const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

// Default to the repo-local file for development. In production point SQLITE_PATH
// at a mounted persistent volume (e.g. /var/data/realestate_auth.db) — the
// container filesystem is wiped on every deploy, taking all users with it.
const DB_PATH = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.join(__dirname, 'realestate_auth.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

function connect() {
  if (db) return db;

  // A freshly mounted volume is an empty directory; SQLite will not create it.
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  console.log(`[DB] Connected to ${DB_PATH}, WAL mode enabled`);
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call connect() first.');
  return db;
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { connect, getDb, close };
