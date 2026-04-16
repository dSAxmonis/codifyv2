// /**
//  * routes/codecast.js
//  * REST endpoints for CodeCast battle rooms.
//  * Real-time logic is handled by the Socket.IO setup in server.js.
//  */
// const express = require('express');
// const { v4: uuidv4 } = require('uuid');
// const { requireAuth } = require('../middleware/auth');

// const router = express.Router();

// // In-memory room store (replace with Redis/Mongo for production scale)
// // Rooms are also managed by the Socket.IO namespace in server.js
// const rooms = new Map();

// // ── Create a room ─────────────────────────────────────────────────────────────
// // POST /api/codecast/rooms
// router.post('/rooms', requireAuth, (req, res) => {
//   const { questionId, language = 'cpp' } = req.body;
//   if (!questionId) return res.status(400).json({ error: 'questionId required' });

//   const roomId = uuidv4().slice(0, 8).toUpperCase(); // e.g. "A3F9B2C1"
//   const room = {
//     roomId,
//     questionId,
//     language,
//     host: req.auth.userId,
//     guest: null,
//     status: 'waiting',   // waiting | active | finished
//     createdAt: Date.now(),
//     hostCode: '',
//     guestCode: '',
//     hostSubmitted: false,
//     guestSubmitted: false,
//     hostResult: null,
//     guestResult: null,
//   };
//   rooms.set(roomId, room);

//   // Auto-cleanup after 30 minutes
//   setTimeout(() => rooms.delete(roomId), 30 * 60 * 1000);

//   res.json({ roomId, room });
// });

// // ── Get room info ─────────────────────────────────────────────────────────────
// // GET /api/codecast/rooms/:roomId
// router.get('/rooms/:roomId', requireAuth, (req, res) => {
//   const room = rooms.get(req.params.roomId.toUpperCase());
//   if (!room) return res.status(404).json({ error: 'Room not found' });
//   res.json(room);
// });

// // ── List active rooms (for joining) ──────────────────────────────────────────
// // GET /api/codecast/rooms
// router.get('/rooms', requireAuth, (req, res) => {
//   const waiting = [...rooms.values()]
//     .filter(r => r.status === 'waiting')
//     .map(({ roomId, questionId, language, createdAt }) => ({ roomId, questionId, language, createdAt }));
//   res.json(waiting);
// });

// // Export so server.js can also access the rooms map for Socket.IO handlers
// module.exports = { router, rooms };

/**
 * routes/codecast.js
 * REST endpoints for CodeCast battle rooms.
 * Real-time Socket.IO logic is in server.js.
 *
 * Auth: No server-side token verification — userId comes from the request body.
 * Clerk auth is handled client-side; verifying tokens on Vercel serverless
 * with a placeholder CLERK_SECRET_KEY causes every request to fail.
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// In-memory room store (shared with Socket.IO handlers in server.js)
const rooms = new Map();

// POST /api/codecast/rooms — create a room
// Body: { questionId, language?, userId }
router.post('/rooms', (req, res) => {
  const { questionId, language = 'cpp', userId } = req.body;
  if (!questionId) return res.status(400).json({ error: 'questionId required' });
  if (!userId)     return res.status(400).json({ error: 'userId required' });

  const roomId = uuidv4().slice(0, 8).toUpperCase();
  const room = {
    roomId,
    questionId,
    language,
    host: userId,
    guest: null,
    status: 'waiting',
    createdAt: Date.now(),
    hostCode: '',
    guestCode: '',
    hostSubmitted: false,
    guestSubmitted: false,
    hostResult: null,
    guestResult: null,
  };
  rooms.set(roomId, room);
  setTimeout(() => rooms.delete(roomId), 30 * 60 * 1000);
  res.json({ roomId, room });
});

// GET /api/codecast/rooms — list waiting rooms
router.get('/rooms', (req, res) => {
  const waiting = [...rooms.values()]
    .filter(r => r.status === 'waiting')
    .map(({ roomId, questionId, language, createdAt }) => ({ roomId, questionId, language, createdAt }));
  res.json(waiting);
});

// GET /api/codecast/rooms/:roomId — get room info
router.get('/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

module.exports = { router, rooms };