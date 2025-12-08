const express = require('express');
const crypto = require('crypto');
const Match = require('../models/Match');
const StockScenario = require('../models/StockScenario');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const {
  getRandomTicker,
  getRandomHistoricalPeriod,
  fetchOHLCData,
  splitCandlesForGame,
  classifyDifficulty,
  getCompanyName
} = require('../utils/stockData');
const { generateNewsHeadlines } = require('../utils/newsData');

const router = express.Router();

// Generate 6-digit code
const generateJoinCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Create a new match with dynamically generated AI scenario
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    // Generate a fresh AI-powered scenario
    const ticker = getRandomTicker();
    const period = getRandomHistoricalPeriod();

    console.log(`Creating match with ${ticker} scenario...`);

    const allCandles = await fetchOHLCData(ticker, period.contextStartDate, period.gameEndDate);

    if (allCandles.length < 50) {
      return res.status(503).json({ message: 'Unable to generate scenario, please try again' });
    }

    const { contextCandles, gameCandles } = splitCandlesForGame(allCandles);

    if (gameCandles.length < 20) {
      return res.status(503).json({ message: 'Unable to generate scenario, please try again' });
    }

    // Get company name for anonymization
    const companyName = await getCompanyName(ticker);

    // Generate AI news headlines (anonymized)
    const news = await generateNewsHeadlines(ticker, gameCandles, gameCandles[0].date, companyName);
    const difficulty = classifyDifficulty(gameCandles);

    // Create a dynamic scenario object (not saved to database)
    const scenario = {
      _id: `dyn_${ticker}_${Date.now()}`,
      ticker,
      startDate: gameCandles[0].date,
      endDate: gameCandles[gameCandles.length - 1].date,
      contextCandles,
      gameCandles,
      news,
      description: `Real historical data for ${ticker}`,
      difficulty,
      timesUsed: 0
    };

    console.log(`Generated AI scenario: ${ticker}, ${contextCandles.length} context + ${gameCandles.length} game candles`);

    const player1 = await User.findById(req.userId);

    // Generate unique code
    let joinCode;
    let isUnique = false;
    while (!isUnique) {
      joinCode = generateJoinCode();
      const existing = await Match.findOne({ joinCode, status: 'WAITING' });
      if (!existing) isUnique = true;
    }

    const matchData = {
      player1: {
        userId: req.userId,
        username: player1.username,
        finalEquity: 100000,
      },
      // Store scenario embedded in the match (not referencing database)
      stockScenario: scenario,
      stockTicker: scenario.ticker,
      stockDate: scenario.startDate,
      status: 'WAITING',
      joinCode: joinCode
    };

    // Note: We're embedding the scenario in the match
    const match = new Match({
      player1: matchData.player1,
      scenarioData: scenario, // Store embedded scenario
      stockTicker: matchData.stockTicker,
      stockDate: matchData.stockDate,
      status: matchData.status,
      joinCode: matchData.joinCode
    });
    await match.save();

    // Return match with scenario accessible via stockScenario key
    const responseMatch = match.toObject();
    responseMatch.stockScenario = scenario;

    res.status(201).json(responseMatch);
  } catch (error) {
    console.error('Error creating match:', error);
    next(error);
  }
});

// Join a match
router.post('/join', authMiddleware, async (req, res, next) => {
  try {
    const { joinCode } = req.body;

    const match = await Match.findOne({ joinCode, status: 'WAITING' });
    if (!match) {
      return res.status(404).json({ message: 'Match not found or already started' });
    }

    if (match.player1.userId.toString() === req.userId) {
      return res.status(400).json({ message: 'You cannot join your own match' });
    }

    const player2 = await User.findById(req.userId);

    match.player2 = {
      userId: req.userId,
      username: player2.username,
      finalEquity: 100000,
    };
    match.status = 'IN_PROGRESS';

    await match.save();

    // Return match with embedded scenario accessible via stockScenario key
    const responseMatch = match.toObject();
    if (responseMatch.scenarioData) {
      responseMatch.stockScenario = responseMatch.scenarioData;
    }

    res.json(responseMatch);
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
      (!match.player2 || match.player2.userId.toString() !== req.userId)
    ) {
      return res.status(403).json({ message: 'Not authorized to update this match' });
    }

    console.log(`[UpdateMatch] ID: ${req.params.id} Body:`, req.body);

    if (player1FinalEquity !== undefined) {
      match.player1.finalEquity = player1FinalEquity;
      match.player1.finalPnL = player1FinalEquity - 100000;
      match.player1.isFinished = true;
      if (player1Trades) match.player1.trades = player1Trades;
      console.log(`[UpdateMatch] Player 1 finished. Equity: ${player1FinalEquity}`);
    }

    if (player2FinalEquity !== undefined && match.player2) {
      match.player2.finalEquity = player2FinalEquity;
      match.player2.finalPnL = player2FinalEquity - 100000;
      match.player2.isFinished = true;
      if (player2Trades) match.player2.trades = player2Trades;
      console.log(`[UpdateMatch] Player 2 finished. Equity: ${player2FinalEquity}`);
    }

    // Check if both finished using flags
    const p1Finished = match.player1.isFinished;
    // Check if p2 exists and is finished. If p2 doesn't exist (solo?), we might treat as finished?
    // But current logic requires p2 for COMPLETED status if it was initialized?
    // Actually, if match.player2.userId is set, then p2 exists.
    const p2Exists = match.player2 && match.player2.userId;
    const p2Finished = p2Exists ? match.player2.isFinished : true; // If no p2, consider finished?

    console.log(`[UpdateMatch] Status Check - P1: ${p1Finished}, P2: ${p2Finished} (Exists: ${!!p2Exists})`);

    if (p1Finished && p2Finished) {
      match.status = 'COMPLETED';
      console.log('[UpdateMatch] Match COMPLETED. Calculating winner...');

      // Determine winner
      let p1Equity = match.player1.finalEquity;
      let p2Equity = p2Exists ? match.player2.finalEquity : -Infinity;

      if (p1Equity > p2Equity) {
        match.winner = match.player1.userId;
      } else if (p2Exists && p2Equity > p1Equity) {
        match.winner = match.player2.userId;
      }
    }

    if (notes) match.notes = notes;

    await match.save();

    // Update stats if completed
    if (match.status === 'COMPLETED') {
      console.log('[UpdateMatch] Updating User Stats...');
      // Update player 1
      const p1 = await User.findById(match.player1.userId);
      if (p1) {
        p1.stats.totalMatches += 1;
        p1.stats.totalPnL += match.player1.finalPnL;
        p1.stats.avgPnL = p1.stats.totalPnL / p1.stats.totalMatches;
        if (match.winner && match.winner.toString() === p1._id.toString()) p1.stats.wins += 1;
        else if (match.winner && match.winner.toString() !== p1._id.toString()) p1.stats.losses += 1;
        // Note: Draw counts as neither win nor loss in this logic? Or simplistic?
        await p1.save();
        console.log(`[UpdateMatch] Updated P1 stats: ${p1.username}`);
      }

      // Update player 2
      if (p2Exists) {
        const p2 = await User.findById(match.player2.userId);
        if (p2) {
          p2.stats.totalMatches += 1;
          p2.stats.totalPnL += match.player2.finalPnL;
          p2.stats.avgPnL = p2.stats.totalPnL / p2.stats.totalMatches;
          if (match.winner && match.winner.toString() === p2._id.toString()) p2.stats.wins += 1;
          else if (match.winner && match.winner.toString() !== p2._id.toString()) p2.stats.losses += 1;
          await p2.save();
          console.log(`[UpdateMatch] Updated P2 stats: ${p2.username}`);
        }
      }
    }

    res.json(match);
  } catch (error) {
    console.error('[UpdateMatch] Error:', error);
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
      (!match.player2 || match.player2.userId.toString() !== req.userId)
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
      (!match.player2 || match.player2.userId.toString() !== req.userId)
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
      match.player2 ? analyzeTradePerformance(
        match.player2.trades || [],
        match.stockTicker,
        match.stockDate,
        scenario.gameCandles || [],
        scenario.news || [],
        match.player2.finalEquity || 100000
      ) : Promise.resolve("No opponent")
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
