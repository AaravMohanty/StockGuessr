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
    socket.join(`match_${matchId}`);
    activeMatches.set(`match_${matchId}`, true);

    io.to(`match_${matchId}`).emit('player_joined', {
      userId,
      playerCount: io.sockets.adapter.rooms.get(`match_${matchId}`).size,
    });
  });

  // Handle game state updates
  socket.on('game_state_update', (data) => {
    const { matchId, gameState } = data;
    io.to(`match_${matchId}`).emit('game_state_update', gameState);
  });

  // Handle trade action
  socket.on('trade_action', (data) => {
    const { matchId, playerId, action, price, week } = data;
    io.to(`match_${matchId}`).emit('trade_executed', {
      playerId,
      action,
      price,
      week,
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
