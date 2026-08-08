const { verifyAccessToken } = require('../utils/tokens');

const ACCESS_COOKIE = 'ra_access';
const REFRESH_COOKIE = 'ra_refresh';

/**
 * Reads the access token from the HttpOnly cookie.
 * Falls back to the Authorization header so non-browser API clients still work.
 */
function extractToken(req) {
  if (req.cookies && req.cookies[ACCESS_COOKIE]) return req.cookies[ACCESS_COOKIE];
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

/** Require a valid access token. 401 otherwise. */
const authMiddleware = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required', code: 'NO_TOKEN' });
  }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      message: expired ? 'Access token expired' : 'Invalid token',
      // The frontend interceptor keys off this code to trigger a silent refresh.
      code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
    });
  }
};

/**
 * Attaches req.user when a valid token is present, but never rejects.
 * Used for routes that behave differently for Guests without requiring login.
 */
const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

module.exports = { authMiddleware, optionalAuth, extractToken, ACCESS_COOKIE, REFRESH_COOKIE };
