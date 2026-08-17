const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { logAuthEvent, reqContext } = require('../utils/audit');

// NOTE FOR SERVERLESS DEPLOYMENTS
// express-rate-limit's default MemoryStore is per-process. On Vercel each
// concurrent container gets its own counter, so the effective limit is
// (max x number of warm containers) rather than `max`. That is weaker than it
// looks under a distributed attack. For a real limit, back this with a shared
// store — @upstash/ratelimit or rate-limit-redis — keyed the same way.

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
  handler: async (req, res) => {
    const ctx = reqContext(req);
    // Awaited so the event is committed before the container can freeze.
    await logAuthEvent({
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

// The AI routes fan out to paid third-party APIs (Groq, then Gemini) and to the
// ML service. What an unthrottled caller burns here is billing quota, not just
// CPU — so these endpoints need a limit even though they touch no credentials
// and read no user data. Left unlimited they are a denial-of-wallet target.
//
// Keyed by user id when a token is present so one visitor behind a shared NAT
// cannot exhaust the budget for everyone else on that IP, falling back to the
// IP subnet for guests. Requires optionalAuth to run first — that is what
// populates req.user; without it every caller collapses into the guest bucket.
// The per-process MemoryStore caveat at the top of this file applies here too.
const AI_MAX_PER_HOUR = 40;

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: AI_MAX_PER_HOUR,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?.id ? `user:${req.user.id}` : `ip:${ipKey(req)}`),
  handler: (req, res) => {
    res.status(429).json({
      message: 'AI request limit reached. Please try again later.',
      code: 'RATE_LIMIT',
    });
  },
});

module.exports = { loginLimiter, registerLimiter, forgotPasswordLimiter, aiLimiter, AI_MAX_PER_HOUR };
