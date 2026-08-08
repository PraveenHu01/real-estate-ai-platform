const crypto = require('crypto');
const { query } = require('../db/postgres');

// Single writer for every auth event. Never throws — a failure to log
// must not break the auth flow it is observing.
//
// Async since the Postgres migration. Callers should await: in a serverless
// runtime an un-awaited write can be lost when the container freezes after
// the response is sent.

const EVENT_TYPES = [
  'register', 'login_success', 'login_failure', 'logout',
  'account_locked', 'token_refresh', 'refresh_reuse_detected',
  'email_verified', 'password_reset_requested', 'password_reset_completed',
  'mfa_setup', 'mfa_enabled', 'mfa_success', 'mfa_failure',
  'prompt_injection_attempt', 'rate_limit_exceeded',
];

async function logAuthEvent({ userId = null, eventType, ip = null, userAgent = null, success = true, detail = null }) {
  try {
    await query(
      `INSERT INTO auth_events (id, user_id, event_type, ip, user_agent, success, detail, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        crypto.randomUUID(),
        userId,
        String(eventType),
        ip ? String(ip).slice(0, 64) : null,
        userAgent ? String(userAgent).slice(0, 256) : null,
        !!success,
        detail ? String(detail).slice(0, 512) : null,
        Date.now(),
      ]
    );
  } catch (err) {
    console.error('[audit] Failed to write event:', eventType, err.message);
  }
}

/** Pull request context in one place so callers stay terse. */
function reqContext(req) {
  return {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
  };
}

async function getEventsForUser(userId, limit = 50) {
  const { rows } = await query(
    `SELECT id, event_type, ip, user_agent, success, detail, created_at
     FROM auth_events WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

async function getAllEvents(limit = 200) {
  const { rows } = await query(
    `SELECT id, user_id, event_type, ip, user_agent, success, detail, created_at
     FROM auth_events
     ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

module.exports = { logAuthEvent, reqContext, getEventsForUser, getAllEvents, EVENT_TYPES };
