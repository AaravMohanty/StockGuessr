require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./utils/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matches');
const scenarioRoutes = require('./routes/scenarios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Connect to MongoDB
connectDB();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/scenarios', scenarioRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root route
app.get('/', (req, res) => {
  res.send('StockGuessr API is running');
});

// Socket.io
const activeMatches = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join match room
  socket.on('join_match', (data) => {
    const { matchId, userId } = data;
    const roomName = `match_${matchId}`;
    
    socket.join(roomName);
    activeMatches.set(roomName, true);

    const room = io.sockets.adapter.rooms.get(roomName);
    const playerCount = room ? room.size : 0;

    console.log(`User ${userId} joined match ${matchId}. Total players: ${playerCount}`);

    // Notify everyone in the room (including sender)
    io.to(roomName).emit('player_joined', {
      userId,
      playerCount,
    });

    // If 2 players, start game
    if (playerCount === 2) {
      io.to(roomName).emit('match_ready', { start: true });
    }
  });

  // Handle game state updates
  socket.on('game_state_update', (data) => {
    const { matchId, gameState } = data;
    socket.to(`match_${matchId}`).emit('game_state_update', gameState);
  });

  // Handle trade action
  socket.on('trade_action', (data) => {
    const { matchId, playerId, action, price, week, pnl, shares } = data;
    // Broadcast to opponent
    socket.to(`match_${matchId}`).emit('opponent_trade', {
      playerId,
      action,
      price,
      week,
      pnl,
      shares
    });
  });

  // Leave match
  socket.on('leave_match', (data) => {
    const { matchId } = data;
    socket.leave(`match_${matchId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
