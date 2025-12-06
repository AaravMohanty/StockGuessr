const yahooFinance = require('yahoo-finance2').default;

// Curated list of liquid, well-known S&P 500 stocks
const STOCK_UNIVERSE = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'JPM', 'V', 'JNJ',
    'WMT', 'PG', 'UNH', 'HD', 'MA', 'BAC', 'XOM', 'PFE', 'KO', 'PEP',
    'COST', 'DIS', 'CSCO', 'VZ', 'ADBE', 'NFLX', 'INTC', 'AMD', 'CRM', 'NKE',
    'MCD', 'T', 'ORCL', 'IBM', 'GS', 'MS', 'TXN', 'QCOM', 'UPS', 'CAT',
    'BA', 'GE', 'MMM', 'CVX', 'LMT', 'RTX', 'SBUX', 'BKNG', 'PYPL', 'SQ'
];

/**
 * Get a random ticker from the stock universe
 */
const getRandomTicker = () => {
    const randomIndex = Math.floor(Math.random() * STOCK_UNIVERSE.length);
    return STOCK_UNIVERSE[randomIndex];
};

/**
 * Get a random historical period for the game
 * Returns dates for ~4 months total: 3 months context + 1 month game
 * Period must be at least 1 year ago to ensure data is complete
 */
const getRandomHistoricalPeriod = () => {
    const now = new Date();

    // Pick a random end date between 1 and 5 years ago
    const yearsAgo = 1 + Math.floor(Math.random() * 4); // 1-4 years
    const monthOffset = Math.floor(Math.random() * 12); // Random month within that year

    const gameEndDate = new Date(now);
    gameEndDate.setFullYear(gameEndDate.getFullYear() - yearsAgo);
    gameEndDate.setMonth(gameEndDate.getMonth() - monthOffset);

    // Game is 4 weeks (20 trading days ≈ 1 month)
    const gameStartDate = new Date(gameEndDate);
    gameStartDate.setMonth(gameStartDate.getMonth() - 1);

    // Context is 3 months before game starts
    const contextStartDate = new Date(gameStartDate);
    contextStartDate.setMonth(contextStartDate.getMonth() - 3);

    return {
        contextStartDate,
        gameStartDate,
        gameEndDate
    };
};

/**
 * Fetch historical OHLC data from Yahoo Finance
 */
const fetchOHLCData = async (ticker, startDate, endDate) => {
    try {
        const queryOptions = {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        };

        const result = await yahooFinance.chart(ticker, queryOptions);

        if (!result || !result.quotes || result.quotes.length === 0) {
            throw new Error(`No data found for ${ticker}`);
        }

        // Transform to our candle format
        const candles = result.quotes
            .filter(q => q.open && q.high && q.low && q.close && q.volume)
            .map(q => ({
                date: new Date(q.date),
                open: parseFloat(q.open.toFixed(2)),
                high: parseFloat(q.high.toFixed(2)),
                low: parseFloat(q.low.toFixed(2)),
                close: parseFloat(q.close.toFixed(2)),
                volume: q.volume
            }));

        return candles;
    } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error.message);
        throw error;
    }
};

/**
 * Split candles into context (3 months) and game (4 weeks = 20 trading days)
 */
const splitCandlesForGame = (candles) => {
    // Game is the last 20 trading days
    const gameCandles = candles.slice(-20);
    // Context is everything before that
    const contextCandles = candles.slice(0, -20);

    return { contextCandles, gameCandles };
};

/**
 * Classify difficulty based on volatility
 */
const classifyDifficulty = (candles) => {
    if (candles.length < 10) return 'MEDIUM';

    // Calculate average daily move
    let totalMove = 0;
    for (const candle of candles) {
        const move = Math.abs((candle.close - candle.open) / candle.open);
        totalMove += move;
    }
    const avgMove = totalMove / candles.length;

    // Classify based on average move
    if (avgMove > 0.03) return 'HARD';      // > 3% avg daily move
    if (avgMove < 0.01) return 'EASY';      // < 1% avg daily move
    return 'MEDIUM';
};

module.exports = {
    STOCK_UNIVERSE,
    getRandomTicker,
    getRandomHistoricalPeriod,
    fetchOHLCData,
    splitCandlesForGame,
    classifyDifficulty
};
