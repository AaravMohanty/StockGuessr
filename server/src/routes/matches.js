const express = require('express');
const Match = require('../models/Match');
const StockScenario = require('../models/StockScenario');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Create a new match
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { scenarioId, opponentId } = req.body;

    const scenario = await StockScenario.findById(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: 'Scenario not found' });
    }

    let opponent;
    if (opponentId) {
      opponent = await User.findById(opponentId);
      if (!opponent) {
        return res.status(404).json({ message: 'Opponent not found' });
      }
    }

    const player1 = await User.findById(req.userId);

    const matchData = {
      player1: {
        userId: req.userId,
        username: player1.username,
        finalEquity: 100000,
      },
      stockScenario: scenarioId,
      stockTicker: scenario.ticker,
      stockDate: scenario.startDate,
      status: 'IN_PROGRESS',
    };

    if (opponent) {
      matchData.player2 = {
        userId: opponentId,
        username: opponent.username,
        finalEquity: 100000,
      };
    }

    const match = new Match(matchData);

    await match.save();

    res.status(201).json(match);
  } catch (error) {
    next(error);
  }
});

// Get match by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('stockScenario')
      .populate('winner');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// Update match (complete it)
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { player1FinalEquity, player2FinalEquity, player1Trades, player2Trades, notes } = req.body;

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Only allow owner to update
    if (
      match.player1.userId.toString() !== req.userId &&
      match.player2.userId.toString() !== req.userId
    ) {
      return res.status(403).json({ message: 'Not authorized to update this match' });
    }

    match.player1.finalEquity = player1FinalEquity;
    match.player2.finalEquity = player2FinalEquity;
    match.player1.finalPnL = player1FinalEquity - 100000;
    match.player2.finalPnL = player2FinalEquity - 100000;
    match.player1.trades = player1Trades || [];
    match.player2.trades = player2Trades || [];
    match.status = 'COMPLETED';
    match.notes = notes;

    // Determine winner
    if (player1FinalEquity > player2FinalEquity) {
      match.winner = match.player1.userId;
    } else if (player2FinalEquity > player1FinalEquity) {
      match.winner = match.player2.userId;
    }

    await match.save();

    // Update user stats
    const player1 = await User.findById(match.player1.userId);
    const player2 = await User.findById(match.player2.userId);

    player1.stats.totalMatches += 1;
    player1.stats.totalPnL += match.player1.finalPnL;
    player1.stats.avgPnL = player1.stats.totalPnL / player1.stats.totalMatches;
    if (match.winner.toString() === player1._id.toString()) {
      player1.stats.wins += 1;
    } else {
      player1.stats.losses += 1;
    }
    await player1.save();

    player2.stats.totalMatches += 1;
    player2.stats.totalPnL += match.player2.finalPnL;
    player2.stats.avgPnL = player2.stats.totalPnL / player2.stats.totalMatches;
    if (match.winner.toString() === player2._id.toString()) {
      player2.stats.wins += 1;
    } else {
      player2.stats.losses += 1;
    }
    await player2.save();

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// Get user's match history
router.get('/history/:userId', authMiddleware, async (req, res, next) => {
  try {
    const matches = await Match.find({
      $or: [{ 'player1.userId': req.params.userId }, { 'player2.userId': req.params.userId }],
    })
      .populate('stockScenario')
      .sort({ createdAt: -1 });

    res.json(matches);
  } catch (error) {
    next(error);
  }
});

// Add note to match
router.patch('/:id/note', authMiddleware, async (req, res, next) => {
  try {
    const { note } = req.body;

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Only allow owner to add note
    if (
      match.player1.userId.toString() !== req.userId &&
      match.player2.userId.toString() !== req.userId
    ) {
      return res.status(403).json({ message: 'Not authorized to update this match' });
    }

    match.notes = note;
    await match.save();

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// Delete match
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Only allow owner to delete
    if (
      match.player1.userId.toString() !== req.userId &&
      match.player2.userId.toString() !== req.userId
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this match' });
    }

    await Match.findByIdAndDelete(req.params.id);

    res.json({ message: 'Match deleted' });
  } catch (error) {
    next(error);
  }
});

// Get AI analysis for a match
router.get('/:id/analysis', authMiddleware, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('stockScenario')
      .populate('winner');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Check if analysis already exists
    if (match.aiAnalysis && match.aiAnalysis.player1Analysis) {
      return res.json(match.aiAnalysis);
    }

    // Generate new analysis
    const { analyzeTradePerformance } = require('../utils/aiAnalysis');
    const scenario = match.stockScenario;

    if (!scenario) {
      return res.json({
        player1Analysis: 'Great effort! You competed strategically during this market period.',
        player2Analysis: 'Great effort! You competed strategically during this market period.',
      });
    }

    const [player1Analysis, player2Analysis] = await Promise.all([
      analyzeTradePerformance(
        match.player1.trades || [],
        match.stockTicker,
        match.stockDate,
        scenario.gameCandles || [],
        scenario.news || [],
        match.player1.finalEquity || 100000
      ),
      analyzeTradePerformance(
        match.player2.trades || [],
        match.stockTicker,
        match.stockDate,
        scenario.gameCandles || [],
        scenario.news || [],
        match.player2.finalEquity || 100000
      ),
    ]);

    // Save analysis to match
    match.aiAnalysis = {
      player1Analysis,
      player2Analysis,
    };
    await match.save();

    res.json({ player1Analysis, player2Analysis });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
