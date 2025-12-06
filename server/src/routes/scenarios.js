const express = require('express');
const StockScenario = require('../models/StockScenario');
const authMiddleware = require('../middleware/auth');
const {
  getRandomTicker,
  getRandomHistoricalPeriod,
  fetchOHLCData,
  splitCandlesForGame,
  classifyDifficulty
} = require('../utils/stockData');
const { generateNewsHeadlines } = require('../utils/newsData');

const router = express.Router();

/**
 * Generate a new scenario dynamically from real market data
 * This is the primary endpoint for getting game scenarios
 */
router.get('/generate', authMiddleware, async (req, res, next) => {
  try {
    // Get random ticker and period
    const ticker = req.query.ticker || getRandomTicker();
    const period = getRandomHistoricalPeriod();

    console.log(`Generating scenario for ${ticker} from ${period.contextStartDate.toDateString()} to ${period.gameEndDate.toDateString()}`);

    // Fetch real OHLC data from Yahoo Finance
    const allCandles = await fetchOHLCData(ticker, period.contextStartDate, period.gameEndDate);

    if (allCandles.length < 50) {
      // Not enough data, try another ticker
      console.log(`Not enough data for ${ticker}, retrying...`);
      return res.redirect('/api/scenarios/generate');
    }

    // Split into context and game candles
    const { contextCandles, gameCandles } = splitCandlesForGame(allCandles);

    if (gameCandles.length < 20) {
      console.log(`Not enough game candles for ${ticker}, retrying...`);
      return res.redirect('/api/scenarios/generate');
    }

    // Generate contextual news headlines using AI
    const news = await generateNewsHeadlines(ticker, gameCandles, gameCandles[0].date);

    // Classify difficulty based on volatility
    const difficulty = classifyDifficulty(gameCandles);

    // Build scenario object
    const scenario = {
      _id: `dyn_${ticker}_${Date.now()}`, // Dynamic ID
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

    console.log(`Generated scenario: ${ticker}, ${contextCandles.length} context + ${gameCandles.length} game candles`);

    res.json(scenario);
  } catch (error) {
    console.error('Error generating scenario:', error);
    next(error);
  }
});

/**
 * Get random scenario - now uses dynamic generation
 */
router.get('/random', authMiddleware, async (req, res, next) => {
  try {
    // Redirect to generate endpoint for real-time data
    // Alternatively, we could call the generate logic directly
    const ticker = getRandomTicker();
    const period = getRandomHistoricalPeriod();

    console.log(`Random scenario: ${ticker}`);

    const allCandles = await fetchOHLCData(ticker, period.contextStartDate, period.gameEndDate);

    if (allCandles.length < 50) {
      // Fallback to database if Yahoo Finance fails
      const count = await StockScenario.countDocuments();
      if (count > 0) {
        const random = Math.floor(Math.random() * count);
        const scenario = await StockScenario.findOne().skip(random);
        return res.json(scenario);
      }
      return res.status(503).json({ message: 'Unable to generate scenario, please try again' });
    }

    const { contextCandles, gameCandles } = splitCandlesForGame(allCandles);

    if (gameCandles.length < 20) {
      // Fallback to database
      const count = await StockScenario.countDocuments();
      if (count > 0) {
        const random = Math.floor(Math.random() * count);
        const scenario = await StockScenario.findOne().skip(random);
        return res.json(scenario);
      }
      return res.status(503).json({ message: 'Unable to generate scenario, please try again' });
    }

    const news = await generateNewsHeadlines(ticker, gameCandles, gameCandles[0].date);
    const difficulty = classifyDifficulty(gameCandles);

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

    res.json(scenario);
  } catch (error) {
    console.error('Error in random scenario:', error);

    // Fallback to database on any error
    try {
      const count = await StockScenario.countDocuments();
      if (count > 0) {
        const random = Math.floor(Math.random() * count);
        const scenario = await StockScenario.findOne().skip(random);
        return res.json(scenario);
      }
    } catch (dbError) {
      console.error('Database fallback failed:', dbError);
    }

    next(error);
  }
});

// Get all scenarios (from database)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const scenarios = await StockScenario.find().limit(50);
    res.json(scenarios);
  } catch (error) {
    next(error);
  }
});

// Get scenario by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const scenario = await StockScenario.findById(req.params.id);

    if (!scenario) {
      return res.status(404).json({ message: 'Scenario not found' });
    }

    res.json(scenario);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
