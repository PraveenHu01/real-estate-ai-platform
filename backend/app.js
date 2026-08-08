const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

// The Express app, with no listener attached.
//
// Split out from server.js so the same app can be mounted three ways:
//   - server.js         long-running Node process (local dev, Render, Fly)
//   - api/index.js      Vercel serverless function
//   - tests             supertest, without binding a port
//
// Socket.IO used to live here. It was removed for the Vercel migration:
// serverless functions cannot hold the long-lived connections it needs.
// Chat now polls over REST — see routes/chatRoutes.js.

// Auth secrets must exist before anything reads them. In development genKeys
// writes any missing ones to backend/.env. In production it refuses to
// generate — a serverless filesystem is read-only and per-container, so
// minting secrets at boot would invalidate every session on each cold start.
// Missing secrets there are fatal and must surface at deploy time, not as a
// confusing 500 on the first login.
try {
  require('./utils/genKeys').ensureKeys({ silent: true });
} catch (err) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL]', err.message);
    throw err;
  }
  console.warn('[keys] Could not auto-generate secrets:', err.message);
}

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Comma-separated list so production, staging and localhost can coexist.
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Netlify/Vercel give every pull request a fresh, unpredictable hostname, so
// deploy previews cannot be listed above. Opt in with an ANCHORED regex that
// pins your project slug, e.g.
//   PREVIEW_ORIGIN_REGEX=^https://real-estate-ai-platform-[a-z0-9-]+\.vercel\.app$
// Never widen this to ^https://.*\.vercel\.app$ — anyone can deploy to that
// domain, and combined with credentials:true it would hand them logged-in sessions.
const PREVIEW_ORIGIN_REGEX = process.env.PREVIEW_ORIGIN_REGEX
  ? new RegExp(process.env.PREVIEW_ORIGIN_REGEX)
  : null;

function isAllowedOrigin(origin) {
  // Same-origin requests, curl and platform health checks send no Origin header.
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, '');
  if (ALLOWED_ORIGINS.includes(normalized)) return true;
  return PREVIEW_ORIGIN_REGEX ? PREVIEW_ORIGIN_REGEX.test(normalized) : false;
}

// Reflect only allowlisted origins. Passing `false` (rather than an Error) omits
// the CORS headers so the browser blocks it, without logging a 500 per request.
const corsOptions = {
  origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
  credentials: true,
};

if (process.env.NODE_ENV === 'production' && ALLOWED_ORIGINS.some((o) => o.includes('localhost'))) {
  console.warn('[cors] CLIENT_ORIGIN still contains localhost in production — set it to your deployed frontend URL.');
}

// Trust the proxy so req.ip is accurate behind one (rate limiting depends on this).
app.set('trust proxy', 1);

// Security headers. CSP is disabled in dev because Vite injects inline scripts.
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// Explicit origin + credentials — required for cookies. Wildcard origin is
// incompatible with credentialed requests.
app.use(cors(corsOptions));

app.use(express.json({ limit: '100kb' }));   // bound request body size
app.use(cookieParser());

// ---------------------------------------------------------------------------
// MongoDB (optional) — backs properties and chat only. Auth is Postgres.
// The connection promise is cached on globalThis so warm serverless
// invocations reuse one connection instead of opening a new one per request.
// ---------------------------------------------------------------------------
const MONGO_KEY = Symbol.for('realestate.mongo.conn');

function connectMongo() {
  if (!process.env.MONGO_URI) return null;
  if (globalThis[MONGO_KEY]) return globalThis[MONGO_KEY];

  globalThis[MONGO_KEY] = mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('MongoDB connected (properties/chat)'))
    .catch((err) => {
      console.log('MongoDB unavailable — properties fall back to seed data:', err.message);
      // Reset so a later request can retry rather than caching the failure.
      globalThis[MONGO_KEY] = undefined;
    });

  return globalThis[MONGO_KEY];
}

// Kick off the connection without blocking route registration.
connectMongo();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'AI Real Estate Investment Engine',
    version: '2.1.0',
    auth: 'Postgres + Argon2id + JWT (HttpOnly cookies)',
    database: process.env.DATABASE_URL ? 'configured' : 'DATABASE_URL missing',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'not connected (seed data in use)',
    ai_provider: process.env.GROQ_API_KEY ? 'groq' : (process.env.GEMINI_API_KEY ? 'gemini' : 'fallback only'),
  });
});

// JSON 404 so the SPA's fetch layer never has to parse an HTML error page.
app.use('/api', (req, res) => {
  res.status(404).json({ message: `No such endpoint: ${req.method} ${req.path}` });
});

module.exports = { app, connectMongo, isAllowedOrigin };
