const crypto = require('crypto');
const { getDb } = require('./index');
const { encrypt, decrypt, hashEmail, hashToken } = require('../utils/crypto');

// All SQL lives here. Every statement is parameterized — no string interpolation.

const LOCKOUT_THRESHOLD = 10;          // failed attempts before lockout
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
    createdAt: row.created_at,
  };
}

function createUser({ name, email, passwordHash, role = 'Buyer', phone = '' }) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO users (id, name, email_hash, email_enc, phone_enc, password_hash, role, email_verified, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(id, name, hashEmail(email), encrypt(email), phone ? encrypt(phone) : null, passwordHash, role, Date.now());
  return findById(id);
}

function findByEmail(email) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email_hash = ?').get(hashEmail(email)) || null;
}

function findById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return toUser(row);
}

/** Raw row including password_hash and mfa_secret_enc — for auth paths only. */
function findRawById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

function isLocked(row) {
  return !!(row && row.locked_until && row.locked_until > Date.now());
}

/** Increment failures; lock the account once the threshold is reached. */
function recordFailedAttempt(userId) {
  const db = getDb();
  const row = db.prepare('SELECT failed_attempts FROM users WHERE id = ?').get(userId);
  if (!row) return { locked: false, attempts: 0 };

  const attempts = (row.failed_attempts || 0) + 1;
  const locked = attempts >= LOCKOUT_THRESHOLD;

  db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?')
    .run(attempts, locked ? Date.now() + LOCKOUT_DURATION_MS : null, userId);

  return { locked, attempts };
}

function resetFailedAttempts(userId) {
  getDb().prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(userId);
}

function setEmailVerified(userId) {
  getDb().prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(userId);
}

function setPassword(userId, passwordHash) {
  getDb().prepare('UPDATE users SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?')
    .run(passwordHash, userId);
}

function setMfaSecret(userId, secret) {
  getDb().prepare('UPDATE users SET mfa_secret_enc = ? WHERE id = ?').run(encrypt(secret), userId);
}

function enableMfa(userId) {
  getDb().prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(userId);
}

function getMfaSecret(userId) {
  const row = getDb().prepare('SELECT mfa_secret_enc FROM users WHERE id = ?').get(userId);
  return row && row.mfa_secret_enc ? decrypt(row.mfa_secret_enc) : null;
}

function countUsers() {
  return getDb().prepare('SELECT COUNT(*) AS n FROM users').get().n;
}

// ---- refresh tokens ----

function storeRefreshToken({ userId, token, expiresAt, userAgent, ip }) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, user_agent, ip, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, hashToken(token), expiresAt, userAgent || null, ip || null, Date.now());
  return id;
}

function findRefreshToken(token) {
  return getDb().prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get(hashToken(token)) || null;
}

function revokeRefreshToken(token) {
  getDb().prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL')
    .run(Date.now(), hashToken(token));
}

/** Revoke every active token for a user — used on reuse detection (token theft). */
function revokeAllUserTokens(userId) {
  const r = getDb().prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL')
    .run(Date.now(), userId);
  return r.changes;
}

// ---- verification / reset tokens ----

function storeVerificationToken({ userId, token, purpose, expiresAt }) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO verification_tokens (id, user_id, token_hash, purpose, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, hashToken(token), purpose, expiresAt, Date.now());
  return id;
}

function findVerificationToken(token, purpose) {
  return getDb().prepare(
    'SELECT * FROM verification_tokens WHERE token_hash = ? AND purpose = ?'
  ).get(hashToken(token), purpose) || null;
}

function consumeVerificationToken(id) {
  getDb().prepare('UPDATE verification_tokens SET used_at = ? WHERE id = ?').run(Date.now(), id);
}

module.exports = {
  toUser, createUser, findByEmail, findById, findRawById,
  isLocked, recordFailedAttempt, resetFailedAttempts,
  setEmailVerified, setPassword, setMfaSecret, enableMfa, getMfaSecret, countUsers,
  storeRefreshToken, findRefreshToken, revokeRefreshToken, revokeAllUserTokens,
  storeVerificationToken, findVerificationToken, consumeVerificationToken,
  LOCKOUT_THRESHOLD, LOCKOUT_DURATION_MS,
};
