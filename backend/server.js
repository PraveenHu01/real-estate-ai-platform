const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

// Generate any missing auth secrets before anything reads them.
require('./utils/genKeys').ensureKeys({ silent: true });

const { connect } = require('./db');
const { verifyAccessToken } = require('./utils/tokens');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const server = http.createServer(app);

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

const io = socketIo(server, {
  cors: { origin: (origin, cb) => cb(null, isAllowedOrigin(origin)), methods: ['GET', 'POST'], credentials: true }
});

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
    version: '2.0.0',
    auth: 'SQLite + Argon2id + JWT (HttpOnly cookies)',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Not used for auth',
  });
});

// Socket.IO auth — reject unauthenticated sockets instead of trusting the client.
io.use((socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie || '';
    const match = cookies.match(/ra_access=([^;]+)/);
    if (!match) return next(new Error('Authentication required'));
    socket.user = verifyAccessToken(decodeURIComponent(match[1]));
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  console.log(`[socket] ${socket.user?.email || 'unknown'} connected`);

  socket.on('joinRoom', ({ propertyId }) => {
    socket.join(String(propertyId));
  });

  socket.on('sendMessage', (data) => {
    // Stamp identity server-side; never trust a client-supplied sender.
    io.to(String(data.propertyId)).emit('newMessage', {
      ...data,
      senderId: socket.user.id,
      senderName: socket.user.name,
      at: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`[socket] ${socket.user?.email || 'unknown'} disconnected`);
  });
});

// Initialize the auth database.
connect();

// MongoDB stays optional — it backs properties/chat, not auth.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/real_estate_ai';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected (properties/chat)'))
  .catch(() => console.log('MongoDB not running — properties use in-memory seed data. Auth is unaffected (SQLite).'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`  Real Estate AI Platform Backend on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Auth:   SQLite + Argon2id + JWT cookies`);
  console.log('====================================================');
});
