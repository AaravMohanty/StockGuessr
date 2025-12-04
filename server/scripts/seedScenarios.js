require('dotenv').config();
const mongoose = require('mongoose');
const StockScenario = require('../src/models/StockScenario');
const connectDB = require('../src/utils/db');

const sampleScenarios = [
  {
    ticker: 'TSLA',
    startDate: new Date('2021-01-01'),
    endDate: new Date('2021-04-01'),
    contextCandles: generateCandles(new Date('2020-10-01'), new Date('2021-01-01'), 800, 850),
    gameCandles: generateCandles(new Date('2021-01-01'), new Date('2021-04-01'), 850, 900),
    news: [
      { week: 1, headline: 'Tesla Q4 2020 earnings beat expectations', date: new Date('2021-01-27') },
      { week: 2, headline: 'Tesla joins S&P 500 index', date: new Date('2021-02-02') },
      { week: 3, headline: 'Elon Musk becomes world\'s richest person', date: new Date('2021-02-19') },
      { week: 4, headline: 'Bitcoin volatility impacts tech stocks', date: new Date('2021-03-05') },
    ],
    difficulty: 'MEDIUM',
  },
  {
    ticker: 'AAPL',
    startDate: new Date('2020-03-01'),
    endDate: new Date('2020-06-01'),
    contextCandles: generateCandles(new Date('2019-12-01'), new Date('2020-03-01'), 75, 80),
    gameCandles: generateCandles(new Date('2020-03-01'), new Date('2020-06-01'), 65, 85),
    news: [
      { week: 1, headline: 'COVID-19 pandemic impacts markets', date: new Date('2020-03-11') },
      { week: 2, headline: 'Apple stores begin reopening', date: new Date('2020-03-27') },
      { week: 3, headline: 'Tech stocks recover as markets stabilize', date: new Date('2020-04-15') },
      { week: 4, headline: 'Apple Q2 earnings call scheduled', date: new Date('2020-04-28') },
    ],
    difficulty: 'HARD',
  },
  {
    ticker: 'MSFT',
    startDate: new Date('2022-01-01'),
    endDate: new Date('2022-04-01'),
    contextCandles: generateCandles(new Date('2021-10-01'), new Date('2022-01-01'), 310, 325),
    gameCandles: generateCandles(new Date('2022-01-01'), new Date('2022-04-01'), 320, 300),
    news: [
      { week: 1, headline: 'Microsoft reports strong cloud growth', date: new Date('2022-01-25') },
      { week: 2, headline: 'Fed signals interest rate hikes', date: new Date('2022-02-16') },
      { week: 3, headline: 'Tech selloff continues amid inflation concerns', date: new Date('2022-02-28') },
      { week: 4, headline: 'Microsoft stock drops on guidance', date: new Date('2022-03-04') },
    ],
    difficulty: 'EASY',
  },
  {
    ticker: 'NVDA',
    startDate: new Date('2022-06-01'),
    endDate: new Date('2022-09-01'),
    contextCandles: generateCandles(new Date('2022-03-01'), new Date('2022-06-01'), 150, 180),
    gameCandles: generateCandles(new Date('2022-06-01'), new Date('2022-09-01'), 180, 220),
    news: [
      { week: 1, headline: 'ChatGPT launch sparks AI investment wave', date: new Date('2022-06-15') },
      { week: 2, headline: 'Data centers order record GPUs', date: new Date('2022-07-01') },
      { week: 3, headline: 'Nvidia announces H100 chips demand surge', date: new Date('2022-07-20') },
      { week: 4, headline: 'Wall Street raises price targets on AI momentum', date: new Date('2022-08-10') },
    ],
    difficulty: 'MEDIUM',
  },
  {
    ticker: 'AMZN',
    startDate: new Date('2020-03-01'),
    endDate: new Date('2020-06-01'),
    contextCandles: generateCandles(new Date('2019-12-01'), new Date('2020-03-01'), 1900, 1950),
    gameCandles: generateCandles(new Date('2020-03-01'), new Date('2020-06-01'), 1950, 2200),
    news: [
      { week: 1, headline: 'Pandemic drives unprecedented e-commerce surge', date: new Date('2020-03-11') },
      { week: 2, headline: 'Amazon Web Services growth accelerates', date: new Date('2020-04-01') },
      { week: 3, headline: 'Warehouse capacity strained by demand', date: new Date('2020-04-20') },
      { week: 4, headline: 'Amazon reports record Q2 earnings', date: new Date('2020-05-15') },
    ],
    difficulty: 'EASY',
  },
  {
    ticker: 'META',
    startDate: new Date('2021-10-01'),
    endDate: new Date('2021-12-01'),
    contextCandles: generateCandles(new Date('2021-07-01'), new Date('2021-10-01'), 320, 350),
    gameCandles: generateCandles(new Date('2021-10-01'), new Date('2021-12-01'), 350, 370),
    news: [
      { week: 1, headline: 'Meta invests in metaverse infrastructure', date: new Date('2021-10-15') },
      { week: 2, headline: 'Apple privacy changes impact ad targeting', date: new Date('2021-10-30') },
      { week: 3, headline: 'Meta releases new VR headset', date: new Date('2021-11-15') },
      { week: 4, headline: 'Company rebrands to Meta, announces $10B metaverse budget', date: new Date('2021-11-28') },
    ],
    difficulty: 'MEDIUM',
  },
  {
    ticker: 'GOOGL',
    startDate: new Date('2022-11-01'),
    endDate: new Date('2023-01-01'),
    contextCandles: generateCandles(new Date('2022-08-01'), new Date('2022-11-01'), 110, 95),
    gameCandles: generateCandles(new Date('2022-11-01'), new Date('2023-01-01'), 95, 105),
    news: [
      { week: 1, headline: 'ChatGPT launch threatens Google search', date: new Date('2022-11-30') },
      { week: 2, headline: 'Google announces Bard AI assistant', date: new Date('2022-12-05') },
      { week: 3, headline: 'Analysts warn of AI disruption to ad business', date: new Date('2022-12-20') },
      { week: 4, headline: 'Google doubles down on AI research investments', date: new Date('2023-01-10') },
    ],
    difficulty: 'HARD',
  },
  {
    ticker: 'AMD',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-04-01'),
    contextCandles: generateCandles(new Date('2022-10-01'), new Date('2023-01-01'), 60, 70),
    gameCandles: generateCandles(new Date('2023-01-01'), new Date('2023-04-01'), 70, 90),
    news: [
      { week: 1, headline: 'AMD benefits from AI chip demand surge', date: new Date('2023-01-15') },
      { week: 2, headline: 'Data center CPU shipments rise 35%', date: new Date('2023-02-01') },
      { week: 3, headline: 'AMD acquires AI chip specialist for $49B', date: new Date('2023-02-20') },
      { week: 4, headline: 'Analysts boost AMD price targets on AI positioning', date: new Date('2023-03-10') },
    ],
    difficulty: 'MEDIUM',
  },
  {
    ticker: 'IBM',
    startDate: new Date('2021-04-01'),
    endDate: new Date('2021-07-01'),
    contextCandles: generateCandles(new Date('2021-01-01'), new Date('2021-04-01'), 125, 140),
    gameCandles: generateCandles(new Date('2021-04-01'), new Date('2021-07-01'), 140, 130),
    news: [
      { week: 1, headline: 'IBM spins off Kyndryl infrastructure unit', date: new Date('2021-04-20') },
      { week: 2, headline: 'Concerns over tech sector weakness', date: new Date('2021-05-10') },
      { week: 3, headline: 'IBM announces hybrid cloud focus', date: new Date('2021-06-01') },
      { week: 4, headline: 'Investor skepticism on restructuring strategy', date: new Date('2021-06-20') },
    ],
    difficulty: 'HARD',
  },
  {
    ticker: 'INTC',
    startDate: new Date('2022-07-01'),
    endDate: new Date('2022-10-01'),
    contextCandles: generateCandles(new Date('2022-04-01'), new Date('2022-07-01'), 48, 38),
    gameCandles: generateCandles(new Date('2022-07-01'), new Date('2022-10-01'), 38, 30),
    news: [
      { week: 1, headline: 'Intel slides amid chip shortage recovery', date: new Date('2022-07-10') },
      { week: 2, headline: 'TSMC dominance grows in advanced chips', date: new Date('2022-07-28') },
      { week: 3, headline: 'Intel struggles to regain market share', date: new Date('2022-08-15') },
      { week: 4, headline: 'Foundry plans face skepticism', date: new Date('2022-09-05') },
    ],
    difficulty: 'HARD',
  },
];

function generateCandles(startDate, endDate, startPrice, endPrice) {
  const candles = [];
  const dayCount = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  // Calculate daily drift to reach endPrice
  const totalReturn = (endPrice - startPrice) / startPrice;
  const dailyDrift = totalReturn / dayCount;
  const volatility = 0.02; // 2% daily volatility

  let currentPrice = startPrice;

  for (let i = 0; i < dayCount; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const changePercent = dailyDrift + (Math.random() - 0.5) * volatility * 2;
    const open = currentPrice;
    const close = currentPrice * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 50000000) + 10000000;

    candles.push({
      date,
      open: parseFloat(open.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

async function seedDatabase() {
  try {
    await connectDB();

    // Clear existing scenarios
    await StockScenario.deleteMany({});
    console.log('Cleared existing scenarios');

    // Insert new scenarios
    const inserted = await StockScenario.insertMany(sampleScenarios);
    console.log(`Successfully inserted ${inserted.length} scenarios`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
