const crypto = require('crypto');

// AES-256-GCM encryption for PII at rest.
// Email is stored twice: email_enc (recoverable) + email_hash (deterministic, queryable).
// AES-GCM is non-deterministic by design, so it cannot be used in a WHERE clause.

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;   // 96-bit IV recommended for GCM
const TAG_LEN = 16;

function getKey(envVar) {
  const hex = process.env[envVar];
  if (!hex) throw new Error(`${envVar} is not set. Run: node utils/genKeys.js`);
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) throw new Error(`${envVar} must be 32 bytes (64 hex chars), got ${key.length}`);
  return key;
}

/** Encrypt a UTF-8 string. Returns "iv:tag:ciphertext" (all hex). */
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') return null;
  const key = getKey('ENCRYPTION_KEY');
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
}

/** Decrypt "iv:tag:ciphertext". Throws if the auth tag fails (tamper detection). */
function decrypt(payload) {
  if (!payload) return null;
  const parts = String(payload).split(':');
  if (parts.length !== 3) throw new Error('Malformed ciphertext');
  const [ivHex, tagHex, ctHex] = parts;
  const key = getKey('ENCRYPTION_KEY');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  if (tag.length !== TAG_LEN) throw new Error('Malformed auth tag');
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]).toString('utf8');
}

/**
 * Deterministic HMAC-SHA256 of a normalized email, for equality lookups.
 * Uses a separate key from ENCRYPTION_KEY so a leak of one does not compromise the other.
 */
function hashEmail(email) {
  const key = getKey('EMAIL_HMAC_KEY');
  return crypto.createHmac('sha256', key)
    .update(String(email).trim().toLowerCase(), 'utf8')
    .digest('hex');
}

/** SHA-256 for opaque tokens (refresh / verification). Not for passwords. */
function hashToken(token) {
  return crypto.createHash('sha256').update(String(token), 'utf8').digest('hex');
}

/** Constant-time string compare, avoids leaking match position via timing. */
function safeEqual(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

module.exports = { encrypt, decrypt, hashEmail, hashToken, safeEqual };
