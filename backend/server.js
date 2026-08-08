const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: "online",
    platform: "AI Real Estate Investment Engine",
    version: "1.0.0",
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "In-Memory Seed Fallback Active"
  });
});

// Socket.IO Real-Time Chat
io.on('connection', (socket) => {
  console.log('Client connected to Chat socket:', socket.id);

  socket.on('joinRoom', ({ propertyId }) => {
    socket.join(propertyId);
  });

  socket.on('sendMessage', (data) => {
    // Broadcast to property room
    io.to(data.propertyId).emit('newMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// MongoDB Connection with fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/real_estate_ai';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => {
    console.log('MongoDB Notice: Not running locally. Operating in smooth In-Memory Seed Mode.');
  });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Real Estate AI Platform Backend running on port ${PORT}`);
  console.log(`  API Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
