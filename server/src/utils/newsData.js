const OpenAI = require('openai');
const axios = require('axios');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Company name mapping for common tickers
const COMPANY_NAMES = {
    'AAPL': 'Apple',
    'MSFT': 'Microsoft',
    'GOOGL': 'Google',
    'GOOG': 'Google',
    'AMZN': 'Amazon',
    'META': 'Meta',
    'FB': 'Facebook',
    'NVDA': 'Nvidia',
    'TSLA': 'Tesla',
    'JPM': 'JPMorgan',
    'V': 'Visa',
    'JNJ': 'Johnson & Johnson',
    'WMT': 'Walmart',
    'PG': 'Procter & Gamble',
    'UNH': 'UnitedHealth',
    'HD': 'Home Depot',
    'MA': 'Mastercard',
    'BAC': 'Bank of America',
    'XOM': 'Exxon',
    'PFE': 'Pfizer',
    'KO': 'Coca-Cola',
    'PEP': 'Pepsi',
    'COST': 'Costco',
    'DIS': 'Disney',
    'CSCO': 'Cisco',
    'VZ': 'Verizon',
    'ADBE': 'Adobe',
    'NFLX': 'Netflix',
    'INTC': 'Intel',
    'AMD': 'AMD',
    'CRM': 'Salesforce',
    'NKE': 'Nike',
    'MCD': "McDonald's",
    'T': 'AT&T',
    'ORCL': 'Oracle',
    'IBM': 'IBM',
    'GS': 'Goldman Sachs',
    'MS': 'Morgan Stanley',
    'TXN': 'Texas Instruments',
    'QCOM': 'Qualcomm',
    'UPS': 'UPS',
    'CAT': 'Caterpillar',
    'BA': 'Boeing',
    'GE': 'General Electric',
    'MMM': '3M',
    'CVX': 'Chevron',
    'LMT': 'Lockheed Martin',
    'RTX': 'Raytheon',
    'SBUX': 'Starbucks',
    'BKNG': 'Booking',
    'PYPL': 'PayPal',
    'SQ': 'Block'
};

/**
 * Fetch real news headlines from NewsAPI
 */
const fetchRealNews = async (ticker, startDate, endDate) => {
    try {
        const companyName = COMPANY_NAMES[ticker] || ticker;

        // NewsAPI only allows historical data for paid plans
        // For free tier, we can only get recent news
        // Format dates for API
        const fromDate = new Date(startDate).toISOString().split('T')[0];
        const toDate = new Date(endDate).toISOString().split('T')[0];

        const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
                q: `${companyName} stock OR ${ticker} stock`,
                from: fromDate,
                to: toDate,
                language: 'en',
                sortBy: 'relevancy',
                pageSize: 20,
                apiKey: process.env.NEWSAPI_KEY
            }
        });

        if (response.data.articles && response.data.articles.length > 0) {
            return response.data.articles.map(article => ({
                title: article.title,
                description: article.description,
                publishedAt: new Date(article.publishedAt),
                source: article.source.name
            }));
        }

        return [];
    } catch (error) {
        console.error('NewsAPI error:', error.message);
        return [];
    }
};

/**
 * Anonymize company names in headlines using OpenAI
 */
const anonymizeHeadlines = async (headlines, ticker) => {
    if (headlines.length === 0) return [];

    const companyName = COMPANY_NAMES[ticker] || ticker;

    try {
        const headlineTexts = headlines.map(h => h.title).join('\n');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a text anonymizer. Replace all mentions of "${companyName}", "${ticker}", and any obvious company identifiers with generic terms like "the company", "this stock", "the firm", etc. Keep the headline natural and readable. Return only the anonymized headlines, one per line.`
                },
                { role: 'user', content: headlineTexts }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });

        const anonymized = response.choices[0].message.content.trim().split('\n');

        return headlines.map((h, i) => ({
            ...h,
            originalTitle: h.title,
            title: anonymized[i] || h.title
        }));
    } catch (error) {
        console.error('OpenAI anonymization error:', error.message);
        // Return original headlines if anonymization fails
        return headlines;
    }
};

/**
 * Group headlines by week
 */
const groupHeadlinesByWeek = (headlines, gameCandles, startDate) => {
    const weeklyHeadlines = [[], [], [], []]; // 4 weeks

    headlines.forEach(headline => {
        const headlineDate = new Date(headline.publishedAt);
        const gameStart = new Date(startDate);
        const daysSinceStart = Math.floor((headlineDate - gameStart) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(daysSinceStart / 7);

        if (weekIndex >= 0 && weekIndex < 4) {
            weeklyHeadlines[weekIndex].push(headline);
        }
    });

    return weeklyHeadlines;
};

/**
 * Generate news for scenario - main entry point
 */
const generateNewsHeadlines = async (ticker, gameCandles, startDate) => {
    try {
        const endDate = gameCandles[gameCandles.length - 1]?.date || new Date();

        // Fetch real news from NewsAPI
        let headlines = await fetchRealNews(ticker, startDate, endDate);

        if (headlines.length > 0) {
            // Anonymize the headlines
            headlines = await anonymizeHeadlines(headlines, ticker);

            // Group by week for the game format
            const weeklyHeadlines = groupHeadlinesByWeek(headlines, gameCandles, startDate);

            // Format for scenario - take up to 3 headlines per week
            const news = [];
            for (let week = 0; week < 4; week++) {
                const weekHeadlines = weeklyHeadlines[week].slice(0, 5); // Max 5 per week
                weekHeadlines.forEach((h, idx) => {
                    news.push({
                        week: week + 1,
                        headline: h.title,
                        date: h.publishedAt,
                        source: h.source
                    });
                });
            }

            if (news.length > 0) {
                return news;
            }
        }

        // Fallback to AI-generated headlines if NewsAPI returns nothing
        console.log('No NewsAPI results, falling back to AI generation');
        return await generateFallbackHeadlines(ticker, gameCandles, startDate);

    } catch (error) {
        console.error('Error generating news headlines:', error.message);
        return await generateFallbackHeadlines(ticker, gameCandles, startDate);
    }
};

/**
 * Generate AI headlines as fallback
 */
const generateFallbackHeadlines = async (ticker, gameCandles, startDate) => {
    try {
        // Calculate weekly price changes for context
        const weeklyChanges = [];
        for (let week = 0; week < 4; week++) {
            const weekStart = week * 5;
            const weekEnd = Math.min(weekStart + 4, gameCandles.length - 1);

            if (weekStart < gameCandles.length && weekEnd < gameCandles.length) {
                const openPrice = gameCandles[weekStart].open;
                const closePrice = gameCandles[weekEnd].close;
                const change = ((closePrice - openPrice) / openPrice) * 100;
                weeklyChanges.push({
                    week: week + 1,
                    change: change.toFixed(2),
                    direction: change >= 0 ? 'up' : 'down'
                });
            }
        }

        const prompt = `Generate 8 realistic, ANONYMIZED financial news headlines (2 per week) for a stock over 4 weeks.

Weekly price movements:
${weeklyChanges.map(w => `Week ${w.week}: ${w.direction} ${Math.abs(w.change)}%`).join('\n')}

Requirements:
- Do NOT mention any specific company name or ticker
- Use terms like "the company", "this stock", "the firm", "shares"
- Each headline: 10-15 words, financial journalism tone
- Headlines should reflect the price movement direction

Return ONLY a JSON array:
[{"week": 1, "headline": "..."}, ...]`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a financial news generator. Return only valid JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 800
        });

        const content = response.choices[0].message.content.trim();
        let jsonStr = content;
        if (content.includes('```')) {
            jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        const headlines = JSON.parse(jsonStr);

        return headlines.map(h => {
            const headlineDate = new Date(startDate);
            headlineDate.setDate(headlineDate.getDate() + (h.week - 1) * 7 + Math.floor(Math.random() * 5));
            return {
                week: h.week,
                headline: h.headline,
                date: headlineDate,
                source: 'Market Analysis'
            };
        });

    } catch (error) {
        console.error('Fallback generation error:', error.message);

        // Ultimate fallback
        const templates = [
            'Company shares see increased trading volume amid market activity',
            'Analysts weigh in on stock performance outlook this week',
            'Shares respond to broader market trends and sector movements',
            'Investors monitor stock ahead of upcoming announcements'
        ];

        return templates.map((headline, index) => {
            const headlineDate = new Date(startDate);
            headlineDate.setDate(headlineDate.getDate() + index * 7 + 3);
            return {
                week: index + 1,
                headline,
                date: headlineDate,
                source: 'Market Watch'
            };
        });
    }
};

module.exports = {
    generateNewsHeadlines,
    fetchRealNews,
    anonymizeHeadlines,
    generateFallbackHeadlines
};
