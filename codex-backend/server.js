const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Routes
const authRoute = require('./routes/auth');
const usersRoute = require('./routes/users');
const companiesRoute = require('./routes/companies');
const questionsRoute = require('./routes/questions');
const progressRoute = require('./routes/progress');
const submissionsRoute = require('./routes/submissions');
const experiencesRoute = require('./routes/experiences');
const feedbackRoute = require('./routes/feedback');
const executeRoute = require('./routes/execute');
const { router: codecastRoute, rooms } = require('./routes/codecast');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://codify-nine.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// CodeCast namespace: /codecast
const ccNS = io.of('/codecast');

ccNS.on('connection', (socket) => {
  // join-room handler
  socket.on('join-room', ({ roomId, userId, displayName }) => {
    console.log(`[Socket] join-room request: roomId=${roomId}, userId=${userId}, user=${displayName}`);
    const room = rooms.get(roomId?.toUpperCase());
    if (!room) {
      console.log(`[Socket] Room ${roomId} not found`);
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    let role;
    if (room.host === userId) {
      role = 'host';
    } else if (!room.guest || room.guest === userId) {
      room.guest = userId;
      room.guestName = displayName;
      role = 'guest';
    } else {
      console.log(`[Socket] Room ${roomId} is full (host=${room.host}, guest=${room.guest})`);
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    if (role === 'host') room.hostName = room.hostName || displayName;

    socket.join(roomId);
    socket.data = { roomId, userId, role };

    console.log(`[Socket] User ${userId} joined room ${roomId} as ${role}`);
    socket.emit('room-joined', { role, room });

    if (room.host && room.guest && room.status === 'waiting') {
      console.log(`[Socket] Room ${roomId} starting! battle-start emitted.`);
      room.status = 'active';
      room.startedAt = Date.now();
      ccNS.to(roomId).emit('battle-start', { room });
    } else {
      console.log(`[Socket] Notify room ${roomId} that opponent joined.`);
      socket.to(roomId).emit('opponent-joined', { displayName, role });
    }
  });

  // code-change handler
  socket.on('code-change', ({ roomId, code, language }) => {
    const { role } = socket.data || {};
    const room = rooms.get(roomId);
    if (!room || !role) return;

    if (role === 'host') room.hostCode = code;
    else room.guestCode = code;

    socket.to(roomId).emit('opponent-code', { code, language, role });
  });

  // submit handler
  socket.on('submit', ({ roomId, result }) => {
    const { role, userId } = socket.data || {};
    const room = rooms.get(roomId);
    if (!room || !role) return;

    if (role === 'host') {
      room.hostResult = result;
      room.hostSubmitted = true;
    } else {
      room.guestResult = result;
      room.guestSubmitted = true;
    }

    ccNS.to(roomId).emit('player-submitted', { role, result });

    if (room.hostSubmitted && room.guestSubmitted) {
      room.status = 'finished';
      const hostPassed = room.hostResult?.passed || 0;
      const guestPassed = room.guestResult?.passed || 0;
      let winner = 'draw';
      if (hostPassed > guestPassed) winner = 'host';
      if (guestPassed > hostPassed) winner = 'guest';

      ccNS.to(roomId).emit('battle-end', {
        winner,
        hostResult: room.hostResult,
        guestResult: room.guestResult,
      });
    }
  });

  // chat handler
  socket.on('chat', ({ roomId, message, displayName }) => {
    if (!message?.trim()) return;
    ccNS.to(roomId).emit('chat', {
      displayName,
      message: message.slice(0, 300),
      ts: Date.now(),
    });
  });

  // disconnect handler
  socket.on('disconnect', () => {
    const { roomId, role } = socket.data || {};
    if (roomId) {
      socket.to(roomId).emit('opponent-left', { role });
    }
  });
});

// MongoDB connection
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log('✅ MongoDB connected');
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Security & Parsing
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://codify-nine.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Too many execution requests.' },
});

app.use(globalLimiter);
app.use('/api/execute', executeLimiter);

// Routes
app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/companies', companiesRoute);
app.use('/api/questions', questionsRoute);
app.use('/api/progress', progressRoute);
app.use('/api/submissions', submissionsRoute);
app.use('/api/experiences', experiencesRoute);
app.use('/api/feedback', feedbackRoute);
app.use('/api/execute', executeRoute);
app.use('/api/codecast', codecastRoute);

// Health check
app.get('/health', (_, res) => res.json({
  status: 'ok',
  time: new Date(),
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
}));

// Error Handler
app.use(errorHandler);

// Listen (use server, not app, for Socket.IO)
server.listen(PORT, () => {
  console.log(`🚀 Codify backend running on port ${PORT} (Socket.IO enabled)`);
});

module.exports = app;
