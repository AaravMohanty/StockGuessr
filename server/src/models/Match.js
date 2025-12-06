const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  week: Number,
  action: {
    type: String,
    enum: ['BUY', 'SELL', 'HOLD'],
  },
  price: Number,
  shares: Number,
  pnl: Number,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const matchSchema = new mongoose.Schema(
  {
    player1: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      username: String,
      finalPnL: {
        type: Number,
        default: 0,
      },
      finalEquity: {
        type: Number,
        default: 100000,
      },
      trades: [tradeSchema],
    },
    player2: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      username: String,
      finalPnL: {
        type: Number,
        default: 0,
      },
      finalEquity: {
        type: Number,
        default: 100000,
      },
      trades: [tradeSchema],
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    stockScenario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockScenario',
      required: true,
    },
    stockTicker: String,
    stockDate: Date,
    matchDuration: Number, // in seconds
    status: {
      type: String,
      enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED'], // Added WAITING
      default: 'WAITING',
    },
    notes: String,
    aiAnalysis: {
      player1Analysis: String,
      player2Analysis: String,
    },
    joinCode: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
