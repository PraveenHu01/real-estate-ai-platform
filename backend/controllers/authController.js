const crypto = require('crypto');

const users = require('../db/users');
const { hashPassword, verifyPassword, validatePassword, checkPolicy } = require('../utils/password');
const {
  generateTokenPair, verifyRefreshToken, generateSecureToken, expiresAt,
} = require('../utils/tokens');
const { logAuthEvent, reqContext, getEventsForUser, getAllEvents } = require('../utils/audit');
const { ACCESS_COOKIE, REFRESH_COOKIE } = require('../middleware/authMiddleware');

const ACCESS_MAX_AGE = 15 * 60 * 1000;          // 15 minutes
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const VERIFY_TOKEN_TTL = 24 * 60 * 60 * 1000;    // 24 hours
const RESET_TOKEN_TTL = 60 * 60 * 1000;          // 1 hour

// Roles that must complete MFA once enrolled.
const MFA_REQUIRED_ROLES = ['Agent', 'Admin'];
const VALID_ROLES = ['Guest', 'Buyer', 'Seller', 'Agent', 'Admin'];
// Self-service registration cannot grant privileged roles — those are assigned by an Admin.
const SELF_SIGNUP_ROLES = ['Buyer', 'Seller'];

const isProd = () => process.env.NODE_ENV === 'production';

// Postgres returns BIGINT as a string. Comparing "1765..." < Date.now() happens
// to coerce correctly, but arithmetic on it does not — normalise at the edge.
const ms = (v) => (v == null ? null : Number(v));

// When the SPA and API sit on different registrable domains (e.g. a Vercel
// frontend calling a Render backend), the browser treats auth XHR as
// cross-site and Lax cookies are never sent. Set COOKIE_SAMESITE=none there.
// SameSite=None is only honoured on secure connections, so it forces Secure.
const sameSiteMode = () => (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();

function cookieOpts(maxAge) {
  const sameSite = sameSiteMode();
  return {
    httpOnly: true,
    sameSite,
    secure: sameSite === 'none' || isProd(),  // plain-HTTP dev keeps Lax + insecure
    maxAge,
    path: '/',
  };
}

function clearOpts() {
  const sameSite = sameSiteMode();
  return { path: '/', sameSite, secure: sameSite === 'none' || isProd() };
}

function setAuthCookies(res, { access, refresh }) {
  res.cookie(ACCESS_COOKIE, access, cookieOpts(ACCESS_MAX_AGE));
  res.cookie(REFRESH_COOKIE, refresh, cookieOpts(REFRESH_MAX_AGE));
}

function clearAuthCookies(res) {
  // Attributes must match those used at set time or the browser keeps the cookie.
  res.clearCookie(ACCESS_COOKIE, clearOpts());
  res.clearCookie(REFRESH_COOKIE, clearOpts());
}

/**
 * Issue a token pair, persist the refresh token, set cookies.
 * Async since the Postgres migration — the caller MUST await, or the refresh
 * token may not be committed before the container freezes.
 */
async function issueSession(res, req, user) {
  const pair = generateTokenPair(user);
  const ctx = reqContext(req);
  await users.storeRefreshToken({
    userId: user.id,
    token: pair.refresh,
    expiresAt: expiresAt(REFRESH_MAX_AGE),
    userAgent: ctx.userAgent,
    ip: ctx.ip,
  });
  setAuthCookies(res, pair);
  return pair;
}

// ---------------------------------------------------------------- register

exports.register = async (req, res) => {
  const ctx = reqContext(req);
  try {
    const { name, email, password, role, phone } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }

    const pw = await validatePassword(password);
    if (!pw.valid) {
      return res.status(400).json({ message: pw.errors[0], errors: pw.errors, breached: !!pw.breached });
    }

    // Privilege escalation guard: ignore any role outside the self-signup set.
    const requestedRole = SELF_SIGNUP_ROLES.includes(role) ? role : 'Buyer';

    if (await users.findByEmail(email)) {
      // Do not reveal that the address is registered.
      return res.status(201).json({
        message: 'Registration received. Check your email to verify your account.',
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await users.createUser({ name, email, passwordHash, role: requestedRole, phone });

    const token = generateSecureToken();
    await users.storeVerificationToken({
      userId: user.id, token, purpose: 'verify_email', expiresAt: expiresAt(VERIFY_TOKEN_TTL),
    });

    const link = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    console.log('\n========================================');
    console.log(`[email] Verify ${user.email}:\n${link}`);
    console.log('========================================\n');

    await logAuthEvent({ userId: user.id, eventType: 'register', ...ctx, success: true, detail: `role=${requestedRole}` });

    res.status(201).json({
      message: 'Registration successful. Check your email to verify your account.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: false },
    });
  } catch (error) {
    console.error('[register]', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// ------------------------------------------------------------------- login

exports.login = async (req, res) => {
  const ctx = reqContext(req);
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const row = await users.findByEmail(email);

    // Uniform failure response — never disclose whether the account exists.
    const invalid = () => res.status(401).json({ message: 'Invalid email or password' });

    if (!row) {
      await logAuthEvent({ userId: null, eventType: 'login_failure', ...ctx, success: false, detail: 'unknown account' });
      // Match the timing of a real verify so absence isn't detectable.
      await hashPassword(String(password));
      return invalid();
    }

    if (users.isLocked(row)) {
      const mins = Math.ceil((ms(row.locked_until) - Date.now()) / 60000);
      await logAuthEvent({ userId: row.id, eventType: 'login_failure', ...ctx, success: false, detail: 'account locked' });
      return res.status(423).json({
        message: `Account locked after repeated failed attempts. Try again in ${mins} minute(s).`,
        code: 'ACCOUNT_LOCKED',
      });
    }

    const ok = await verifyPassword(row.password_hash, password);
    if (!ok) {
      const { locked, attempts } = await users.recordFailedAttempt(row.id);
      await logAuthEvent({
        userId: row.id, eventType: locked ? 'account_locked' : 'login_failure',
        ...ctx, success: false, detail: `attempt ${attempts}`,
      });
      if (locked) {
        return res.status(423).json({
          message: 'Account locked after 10 failed attempts. Try again in 30 minutes.',
          code: 'ACCOUNT_LOCKED',
        });
      }
      return invalid();
    }

    await users.resetFailedAttempts(row.id);
    const user = users.toUser(row);

    if (!user.emailVerified) {
      await logAuthEvent({ userId: user.id, eventType: 'login_failure', ...ctx, success: false, detail: 'email unverified' });
      return res.status(403).json({
        message: 'Please verify your email before signing in.',
        code: 'EMAIL_UNVERIFIED',
      });
    }

    // MFA gate — issue no session until the code is verified.
    if (user.mfaEnabled) {
      const mfaTicket = generateSecureToken();
      await users.storeVerificationToken({
        userId: user.id, token: mfaTicket, purpose: 'reset_password', expiresAt: expiresAt(5 * 60 * 1000),
      });
      return res.json({ mfaRequired: true, mfaTicket, message: 'Enter your authenticator code' });
    }

    if (MFA_REQUIRED_ROLES.includes(user.role) && !user.mfaEnabled) {
      await issueSession(res, req, user);
      await logAuthEvent({ userId: user.id, eventType: 'login_success', ...ctx, success: true, detail: 'mfa enrollment required' });
      return res.json({ user, mfaEnrollmentRequired: true, message: `${user.role} accounts must enable two-factor authentication.` });
    }

    await issueSession(res, req, user);
    await logAuthEvent({ userId: user.id, eventType: 'login_success', ...ctx, success: true });
    res.json({ user, message: 'Login successful' });
  } catch (error) {
    console.error('[login]', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// --------------------------------------------------------------- MFA verify

exports.verifyMfa = async (req, res) => {
  const ctx = reqContext(req);
  try {
    const { mfaTicket, code } = req.body || {};
    if (!mfaTicket || !code) {
      return res.status(400).json({ message: 'Ticket and code are required' });
    }

    const record = await users.findVerificationToken(mfaTicket, 'reset_password');
    if (!record || record.used_at || ms(record.expires_at) < Date.now()) {
      return res.status(401).json({ message: 'Login session expired. Sign in again.' });
    }

    const secret = await users.getMfaSecret(record.user_id);
    if (!secret) return res.status(400).json({ message: 'MFA is not configured' });

    if (!TOTP.verify({ token: String(code).trim(), secret })) {
      await logAuthEvent({ userId: record.user_id, eventType: 'mfa_failure', ...ctx, success: false });
      await users.recordFailedAttempt(record.user_id);
      return res.status(401).json({ message: 'Invalid authenticator code' });
    }

    await users.consumeVerificationToken(record.id);
    await users.resetFailedAttempts(record.user_id);

    const user = await users.findById(record.user_id);
    await issueSession(res, req, user);
    await logAuthEvent({ userId: user.id, eventType: 'mfa_success', ...ctx, success: true });
    await logAuthEvent({ userId: user.id, eventType: 'login_success', ...ctx, success: true, detail: 'via MFA' });

    res.json({ user, message: 'Login successful' });
  } catch (error) {
    console.error('[verifyMfa]', error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

// ----------------------------------------------------------------- refresh

exports.refresh = async (req, res) => {
  const ctx = reqContext(req);
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const stored = await users.findRefreshToken(token);
    if (!stored) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Refresh token not recognized' });
    }

    // Reuse of an already-revoked token indicates theft: kill the whole family.
    if (stored.revoked_at) {
      const killed = await users.revokeAllUserTokens(stored.user_id);
      await logAuthEvent({
        userId: stored.user_id, eventType: 'refresh_reuse_detected', ...ctx, success: false,
        detail: `revoked ${killed} tokens`,
      });
      clearAuthCookies(res);
      return res.status(401).json({
        message: 'Session security issue detected. Please sign in again.',
        code: 'TOKEN_REUSE',
      });
    }

    if (ms(stored.expires_at) < Date.now()) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    // Rotate: revoke the old, issue a new pair.
    await users.revokeRefreshToken(token);
    const user = await users.findById(payload.id);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'User no longer exists' });
    }

    await issueSession(res, req, user);
    await logAuthEvent({ userId: user.id, eventType: 'token_refresh', ...ctx, success: true });
    res.json({ user, message: 'Token refreshed' });
  } catch (error) {
    console.error('[refresh]', error);
    res.status(500).json({ message: 'Refresh failed' });
  }
};

// ------------------------------------------------------------------ logout

exports.logout = async (req, res) => {
  const ctx = reqContext(req);
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) await users.revokeRefreshToken(token);
    clearAuthCookies(res);
    await logAuthEvent({ userId: req.user?.id || null, eventType: 'logout', ...ctx, success: true });
    res.json({ message: 'Logged out' });
  } catch (error) {
    clearAuthCookies(res);
    res.json({ message: 'Logged out' });
  }
};

// --------------------------------------------------------------------- me

exports.getMe = async (req, res) => {
  const user = await users.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
};

// ----------------------------------------------------------- verify email

exports.verifyEmail = async (req, res) => {
  const ctx = reqContext(req);
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ message: 'Token required' });

    const record = await users.findVerificationToken(token, 'verify_email');
    if (!record || record.used_at || ms(record.expires_at) < Date.now()) {
      return res.status(400).json({ message: 'This verification link is invalid or has expired.' });
    }

    await users.consumeVerificationToken(record.id);
    await users.setEmailVerified(record.user_id);
    await logAuthEvent({ userId: record.user_id, eventType: 'email_verified', ...ctx, success: true });

    res.json({ message: 'Email verified. You can now sign in.' });
  } catch (error) {
    console.error('[verifyEmail]', error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

// --------------------------------------------------------- password reset

exports.forgotPassword = async (req, res) => {
  const ctx = reqContext(req);
  try {
    const { email } = req.body || {};
    // Always 200 — never reveal whether the address is registered.
    const generic = { message: 'If that email is registered, a reset link has been sent.' };
    if (!email) return res.json(generic);

    const row = await users.findByEmail(email);
    if (!row) return res.json(generic);

    const token = generateSecureToken();
    await users.storeVerificationToken({
      userId: row.id, token, purpose: 'reset_password', expiresAt: expiresAt(RESET_TOKEN_TTL),
    });

    const link = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    console.log('\n========================================');
    console.log(`[email] Password reset:\n${link}`);
    console.log('========================================\n');

    await logAuthEvent({ userId: row.id, eventType: 'password_reset_requested', ...ctx, success: true });
    res.json(generic);
  } catch (error) {
    console.error('[forgotPassword]', error);
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  }
};

exports.resetPassword = async (req, res) => {
  const ctx = reqContext(req);
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });

    const record = await users.findVerificationToken(token, 'reset_password');
    if (!record || record.used_at || ms(record.expires_at) < Date.now()) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }

    const pw = await validatePassword(password);
    if (!pw.valid) {
      return res.status(400).json({ message: pw.errors[0], errors: pw.errors, breached: !!pw.breached });
    }

    await users.consumeVerificationToken(record.id);
    await users.setPassword(record.user_id, await hashPassword(password));
    // Invalidate every existing session after a password change.
    await users.revokeAllUserTokens(record.user_id);

    await logAuthEvent({ userId: record.user_id, eventType: 'password_reset_completed', ...ctx, success: true });
    res.json({ message: 'Password updated. You can now sign in.' });
  } catch (error) {
    console.error('[resetPassword]', error);
    res.status(500).json({ message: 'Reset failed' });
  }
};

// ---------------------------------------------------------------- MFA setup

exports.setupMfa = async (req, res) => {
  const ctx = reqContext(req);
  try {
    const user = await users.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const secret = TOTP.generateSecret();
    await users.setMfaSecret(user.id, secret);

    const uri = TOTP.generateURI({ secret, label: user.email, issuer: 'InvestAI Real Estate' });
    const qrDataUrl = await qrcode.toDataURL(uri);

    await logAuthEvent({ userId: user.id, eventType: 'mfa_setup', ...ctx, success: true });
    res.json({ secret, qrDataUrl, message: 'Scan the QR code, then confirm with a code to activate.' });
  } catch (error) {
    console.error('[setupMfa]', error);
    res.status(500).json({ message: 'MFA setup failed' });
  }
};

exports.enableMfa = async (req, res) => {
  const ctx = reqContext(req);
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ message: 'Code required' });

    const secret = await users.getMfaSecret(req.user.id);
    if (!secret) return res.status(400).json({ message: 'Run MFA setup first' });

    if (!TOTP.verify({ token: String(code).trim(), secret })) {
      await logAuthEvent({ userId: req.user.id, eventType: 'mfa_failure', ...ctx, success: false, detail: 'enable' });
      return res.status(400).json({ message: 'Invalid code. Check your authenticator app.' });
    }

    await users.enableMfa(req.user.id);
    await logAuthEvent({ userId: req.user.id, eventType: 'mfa_enabled', ...ctx, success: true });
    res.json({ message: 'Two-factor authentication enabled.' });
  } catch (error) {
    console.error('[enableMfa]', error);
    res.status(500).json({ message: 'Could not enable MFA' });
  }
};

// ------------------------------------------------------------------ audit

exports.getAuditLog = async (req, res) => {
  try {
    const events = req.user.role === 'Admin'
      ? await getAllEvents(200)
      : await getEventsForUser(req.user.id, 50);
    res.json({ events, scope: req.user.role === 'Admin' ? 'all' : 'self' });
  } catch (error) {
    console.error('[getAuditLog]', error);
    res.status(500).json({ message: 'Could not load audit log' });
  }
};

// Exposed for the password-strength endpoint (no auth required).
exports.checkPasswordStrength = async (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string') return res.status(400).json({ message: 'password required' });
  const policy = checkPolicy(password);
  res.json(policy);
};
