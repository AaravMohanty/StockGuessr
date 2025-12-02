# Product Requirements Document (PRD) - StockGuessr

## 1. Executive Summary
**Product:** StockGuessr
**Tagline:** "GeoGuessr for the Stock Market"
**Goal:** A real-time 1v1 competitive trading game where players trade on hidden historical charts.
**Target Audience:** Traders, finance students, and gamers who enjoy high-skill, fast-paced strategy games.
**Key Differentiator:** Real historical data + Real-time multiplayer + AI Post-Game Analysis.

## 2. Core Features & Requirements

### 2.1 Authentication (User System)
*   **Register:** Email, Username, Password.
*   **Login:** JWT-based authentication.
*   **Profile:** View stats (Win Rate, Avg PnL, Rank).
*   **Security:** Passwords hashed (bcrypt), Tokens stored securely (HttpOnly cookies or localStorage with care).

### 2.2 The Game Loop (1v1 Multiplayer)
*   **Matchmaking:** User clicks "Play Now" -> Paired with an opponent (or bot if dev/testing).
*   **The Chart:**
    *   Hidden stock ticker and date.
    *   3 Months of context (Daily candles + Volume).
    *   4 "Weeks" of gameplay.
*   **Gameplay (60-90s per match):**
    *   **Week 1-4:** New candles reveal, News headlines pop up.
    *   **Actions:** BUY (Long), SELL (Close Position), HOLD (Do Nothing).
    *   **Constraint:** Long-only (for simplicity). Selling closes the position.
    *   **Live Feedback:** See your PnL and **Opponent's PnL** updating in real-time.
*   **Win Condition:** Highest Portfolio Value at the end of Week 4.

#### 2.2.1 Detailed Gameplay Mechanics
*   **Starting Capital:** $100,000 virtual cash.
*   **Pacing:**
    *   Each "Week" lasts ~10-12 seconds.
    *   Decision window: ~5-7 seconds per week.
*   **Information Revealed Per Week:**
    *   Daily candlesticks for that week.
    *   Volume bars.
    *   Real historical news headlines from that specific week.
*   **Trading Logic:**
    *   **BUY:** Enter a long position.
    *   **SELL:** Close the existing long position (flat). **No Shorting.**
    *   **DO NOTHING:** Hold current state.
*   **End of Match:**
    *   All positions auto-close at Week 4 closing price.
    *   Winner declared based on final equity.

### 2.3 Post-Game & AI Analysis ("Wow Factor")
*   **Reveal:** The stock ticker and date are revealed (e.g., "TSLA, Jan 2021").
*   **AI Coach:** An LLM (OpenAI/Gemini) analyzes the player's trades against the historical chart.
    *   *Example Output:* "You bought at $100, which was great support, but you missed the news catalyst in Week 3."
*   **Rematch:** Option to play again.

### 2.4 Match History & Journal (CRUD Resource)
*   **Create:** Matches are auto-saved to the database after finishing.
*   **Read:** Users can browse their "Match History" list.
*   **Update:** Users can add "Notes" to a match (e.g., "Mistimed the breakout").
*   **Delete:** Users can delete a match from their history.

## 3. Technical Architecture

### 3.1 Tech Stack (MERN)
*   **Frontend:** React (Vite), TailwindCSS, Recharts (for charts), Framer Motion (animations).
*   **Backend:** Node.js, Express.
*   **Database:** MongoDB (Users, Matches, StockData).
*   **Real-Time:** Socket.io (for game state sync).
*   **AI:** OpenAI API (for post-game analysis).

### 3.2 Data Strategy
*   **Stock Data:** Pre-fetch a dataset of ~50-100 interesting historical months (Volatile stocks, Crashes, Rallies).
*   **Storage:** Store these "Scenarios" in MongoDB to serve them randomly.

## 4. User Flows

### 4.1 New User
1.  Landing Page -> "Play Now"
2.  Register/Login
3.  Tutorial Overlay (Quick 3-step guide)
4.  Enter Matchmaking

### 4.2 Returning User
1.  Dashboard -> View Stats/History
2.  Click "Find Match"
3.  Play Game
4.  Review AI Analysis
5.  Add Note to Match History

## 5. Success Metrics
*   **Fun Factor:** Do players want to play a second game?
*   **Performance:** No lag in chart rendering or socket updates.
*   **Complexity:** Is the UI clean enough for a non-trader to understand?
