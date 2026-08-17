const argon2 = require('@node-rs/argon2');
const crypto = require('crypto');
const axios = require('axios');

// Argon2id — OWASP baseline params.
const ARGON2_OPTS = {
  algorithm: 2,      // 2 = Argon2id
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

const MIN_LENGTH = 8;

async function hashPassword(password) {
  return argon2.hash(String(password), ARGON2_OPTS);
}

/** Verify a password. Returns false on malformed hashes rather than throwing. */
async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(String(hash), String(password));
  } catch {
    return false;
  }
}

/** Structural policy check. Returns { valid, errors[], score 0-4 }. */
function checkPolicy(password) {
  const errors = [];
  const pw = String(password || '');

  if (pw.length < MIN_LENGTH) errors.push(`Must be at least ${MIN_LENGTH} characters`);
  if (!/[a-z]/.test(pw)) errors.push('Must include a lowercase letter');
  if (!/[A-Z]/.test(pw)) errors.push('Must include an uppercase letter');
  if (!/[0-9]/.test(pw)) errors.push('Must include a number');
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push('Must include a symbol');
  if (/(.)\1{3,}/.test(pw)) errors.push('Avoid 4+ repeated characters in a row');

  let score = 0;
  if (pw.length >= MIN_LENGTH) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  return { valid: errors.length === 0, errors, score: Math.min(score, 4) };
}

/**
 * HaveIBeenPwned range API (k-anonymity).
 * Only the first 5 hex chars of the SHA-1 leave this server; the suffix is matched locally,
 * so the password itself is never transmitted.
 * Fails OPEN (returns breached:false) if HIBP is unreachable — availability of registration
 * should not depend on a third party.
 */
async function checkBreached(password) {
  try {
    const sha1 = crypto.createHash('sha1').update(String(password), 'utf8').digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, {
      timeout: 5000,
      headers: { 'Add-Padding': 'true', 'User-Agent': 'RealEstateAI-Auth' },
    });

    for (const line of String(res.data).split('\n')) {
      const [hashSuffix, count] = line.trim().split(':');
      if (hashSuffix === suffix) {
        return { breached: true, count: parseInt(count, 10) || 0, checked: true };
      }
    }
    return { breached: false, count: 0, checked: true };
  } catch {
    return { breached: false, count: 0, checked: false };
  }
}

/** Full validation: policy + breach. */
async function validatePassword(password) {
  const policy = checkPolicy(password);
  if (!policy.valid) return { valid: false, errors: policy.errors, score: policy.score };

  const breach = await checkBreached(password);
  if (breach.breached) {
    return {
      valid: false,
      score: 0,
      errors: [`This password appeared in ${breach.count.toLocaleString()} known data breaches. Choose a different one.`],
      breached: true,
    };
  }
  return { valid: true, errors: [], score: policy.score, breachChecked: breach.checked };
}

module.exports = {
  hashPassword, verifyPassword, checkPolicy, checkBreached, validatePassword, MIN_LENGTH,
};
