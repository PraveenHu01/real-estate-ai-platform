const crypto = require('crypto');
const { query, queryOne } = require('./postgres');
const { encrypt, decrypt, hashEmail, hashToken } = require('../utils/crypto');

// All SQL lives here. Every statement is parameterized — no string interpolation.
//
// Postgres port of the original SQLite module. Two changes ripple out to every
// caller: placeholders are $1/$2 rather than ?, and every function returns a
// promise. There is no synchronous path to fall back on.

const LOCKOUT_THRESHOLD = 10;                // failed attempts before lockout
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;  // 30 minutes

/** Map a DB row to a safe user object (PII decrypted, secrets omitted). */
function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: decrypt(row.email_enc),
    phone: row.phone_enc ? decrypt(row.phone_enc) : '',
    role: row.role,
    emailVerified: !!row.email_verified,
    mfaEnabled: !!row.mfa_enabled,
    // BIGINT arrives as a string from pg; callers compare it numerically.
    createdAt: Number(row.created_at),
  };
}

async function createUser({ name, email, passwordHash, role = 'Buyer', phone = '' }) {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO users (id, name, email_hash, email_enc, phone_enc, password_hash, role, email_verified, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8)`,
    [id, name, hashEmail(email), encrypt(email), phone ? encrypt(phone) : null, passwordHash, role, Date.now()]
  );
  return findById(id);
}

async function findByEmail(email) {
  return queryOne('SELECT * FROM users WHERE email_hash = $1', [hashEmail(email)]);
}

async function findById(id) {
  return toUser(await queryOne('SELECT * FROM users WHERE id = $1', [id]));
}

/** Raw row including password_hash and mfa_secret_enc — for auth paths only. */
async function findRawById(id) {
  return queryOne('SELECT * FROM users WHERE id = $1', [id]);
}

/** Synchronous: operates on an already-fetched row, so no DB round trip. */
function isLocked(row) {
  return !!(row && row.locked_until && Number(row.locked_until) > Date.now());
}

/** Increment failures; lock the account once the threshold is reached. */
async function recordFailedAttempt(userId) {
  const row = await queryOne('SELECT failed_attempts FROM users WHERE id = $1', [userId]);
  if (!row) return { locked: false, attempts: 0 };

  const attempts = (row.failed_attempts || 0) + 1;
  const locked = attempts >= LOCKOUT_THRESHOLD;

  await query(
    'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
    [attempts, locked ? Date.now() + LOCKOUT_DURATION_MS : null, userId]
  );

  return { locked, attempts };
}

async function resetFailedAttempts(userId) {
  await query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1', [userId]);
}

async function setEmailVerified(userId) {
  await query('UPDATE users SET email_verified = TRUE WHERE id = $1', [userId]);
}

async function setPassword(userId, passwordHash) {
  await query(
    'UPDATE users SET password_hash = $1, failed_attempts = 0, locked_until = NULL WHERE id = $2',
    [passwordHash, userId]
  );
}

async function setMfaSecret(userId, secret) {
  await query('UPDATE users SET mfa_secret_enc = $1 WHERE id = $2', [encrypt(secret), userId]);
}

async function enableMfa(userId) {
  await query('UPDATE users SET mfa_enabled = TRUE WHERE id = $1', [userId]);
}

async function getMfaSecret(userId) {
  const row = await queryOne('SELECT mfa_secret_enc FROM users WHERE id = $1', [userId]);
  return row && row.mfa_secret_enc ? decrypt(row.mfa_secret_enc) : null;
}

async function countUsers() {
  const row = await queryOne('SELECT COUNT(*)::int AS n FROM users');
  return row ? row.n : 0;
}

// ---- refresh tokens ----

async function storeRefreshToken({ userId, token, expiresAt, userAgent, ip }) {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, user_agent, ip, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, userId, hashToken(token), expiresAt, userAgent || null, ip || null, Date.now()]
  );
  return id;
}

async function findRefreshToken(token) {
  return queryOne('SELECT * FROM refresh_tokens WHERE token_hash = $1', [hashToken(token)]);
}

async function revokeRefreshToken(token) {
  await query(
    'UPDATE refresh_tokens SET revoked_at = $1 WHERE token_hash = $2 AND revoked_at IS NULL',
    [Date.now(), hashToken(token)]
  );
}

/** Revoke every active token for a user — used on reuse detection (token theft). */
async function revokeAllUserTokens(userId) {
  const res = await query(
    'UPDATE refresh_tokens SET revoked_at = $1 WHERE user_id = $2 AND revoked_at IS NULL',
    [Date.now(), userId]
  );
  return res.rowCount;
}

// ---- verification / reset tokens ----

async function storeVerificationToken({ userId, token, purpose, expiresAt }) {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO verification_tokens (id, user_id, token_hash, purpose, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, hashToken(token), purpose, expiresAt, Date.now()]
  );
  return id;
}

async function findVerificationToken(token, purpose) {
  return queryOne(
    'SELECT * FROM verification_tokens WHERE token_hash = $1 AND purpose = $2',
    [hashToken(token), purpose]
  );
}

async function consumeVerificationToken(id) {
  await query('UPDATE verification_tokens SET used_at = $1 WHERE id = $2', [Date.now(), id]);
}

module.exports = {
  toUser, createUser, findByEmail, findById, findRawById,
  isLocked, recordFailedAttempt, resetFailedAttempts,
  setEmailVerified, setPassword, setMfaSecret, enableMfa, getMfaSecret, countUsers,
  storeRefreshToken, findRefreshToken, revokeRefreshToken, revokeAllUserTokens,
  storeVerificationToken, findVerificationToken, consumeVerificationToken,
  LOCKOUT_THRESHOLD, LOCKOUT_DURATION_MS,
};
