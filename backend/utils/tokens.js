const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

function getSecret(name) {
  const s = process.env[name];
  if (!s) throw new Error(`${name} not set. Run: node utils/genKeys.js`);
  return s;
}

/** Generate access + refresh tokens. Returns { access, refresh }. */
function generateTokenPair(user) {
  const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
  const access = jwt.sign(payload, getSecret('JWT_ACCESS_SECRET'), { expiresIn: ACCESS_EXPIRES });
  const refresh = jwt.sign({ id: user.id }, getSecret('JWT_REFRESH_SECRET'), { expiresIn: REFRESH_EXPIRES });
  return { access, refresh };
}

/** Verify an access token. Returns decoded payload or throws. */
function verifyAccessToken(token) {
  return jwt.verify(token, getSecret('JWT_ACCESS_SECRET'));
}

/** Verify a refresh token. Returns decoded payload or throws. */
function verifyRefreshToken(token) {
  return jwt.verify(token, getSecret('JWT_REFRESH_SECRET'));
}

/** Generate a random 32-byte hex token for email verification / password reset. */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

/** Calculate expiry timestamp (ms since epoch). */
function expiresAt(durationMs) {
  return Date.now() + durationMs;
}

module.exports = {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  generateSecureToken,
  expiresAt,
  ACCESS_EXPIRES,
  REFRESH_EXPIRES,
};
