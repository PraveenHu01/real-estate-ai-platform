const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { logAuthEvent, reqContext } = require('../utils/audit');

// A single IPv6 client is handed a /64 (often a /48) of addresses, so keying on the
// raw req.ip would let one attacker get a fresh bucket per request. ipKeyGenerator
// collapses v6 to its /56 subnet and leaves v4 untouched.
const ipKey = (req) => ipKeyGenerator(req.ip);

// 5 login attempts per 15 min per IP+email combo.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKey(req)}:${(req.body?.email || 'unknown').toLowerCase()}`,
  handler: (req, res) => {
    const ctx = reqContext(req);
    logAuthEvent({
      userId: null,
      eventType: 'rate_limit_exceeded',
      ...ctx,
      success: false,
      detail: 'login',
    });
    res.status(429).json({
      message: 'Too many login attempts. Please try again in 15 minutes.',
      code: 'RATE_LIMIT',
    });
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 3,
  keyGenerator: ipKey,
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many registration attempts. Try again later.', code: 'RATE_LIMIT' });
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 3,
  keyGenerator: ipKey,
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many password reset requests. Try again later.', code: 'RATE_LIMIT' });
  },
});

module.exports = { loginLimiter, registerLimiter, forgotPasswordLimiter };
