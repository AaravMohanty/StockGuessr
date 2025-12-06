
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, TrendingUp, TrendingDown, Clock, DollarSign, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { scenariosAPI, matchesAPI } from "@/lib/api";
import GameTimer from "@/components/GameTimer";
import ShareInput from "@/components/ShareInput";
import GameChart from "@/components/GameChart";

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface News {
  week: number;
  headline: string;
  date: string;
}

interface Scenario {
  _id: string;
  ticker: string;
  contextCandles: Candle[];
  gameCandles: Candle[];
  news: News[];
  description: string;
  difficulty: string;
  startDate: string;
  endDate: string;
}

interface Trade {
  week: number;
  action: "BUY" | "SELL" | "HOLD";
  price: number;
  shares?: number;
  pnl?: number;
  timestamp: Date;
}

type GamePhase = "matchmaking" | "ready" | "playing" | "completed" | "error";
type RoundPhase = "reveal" | "decision";

const ROUND_DURATION = 12; // Total seconds per week
const DECISION_DURATION = 7; // Seconds for decision

export default function GamePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  // Game State
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [gameState, setGameState] = useState<GamePhase>("matchmaking");
  const [currentWeek, setCurrentWeek] = useState(0);
  const [roundPhase, setRoundPhase] = useState<RoundPhase>("reveal");
  const [matchId, setMatchId] = useState<string | null>(null);

  // Trading State
  const [availableCash, setAvailableCash] = useState(100000);
  const [position, setPosition] = useState<{ shares: number; entryPrice: number; entryWeek: number } | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedShares, setSelectedShares] = useState(0);

  // UI State
  const [isLoadingScenario, setIsLoadingScenario] = useState(true);
  const [showNews, setShowNews] = useState(false);

  // Fetch scenario
  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchScenario();
    } else if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading]);

  const fetchScenario = async () => {
    try {
      setIsLoadingScenario(true);
      const response = await scenariosAPI.getRandomScenario();
      setScenario(response.data);
      setGameState("ready");
    } catch (error) {
      console.error("Failed to fetch scenario:", error);
      setGameState("error");
    } finally {
      setIsLoadingScenario(false);
    }
  };

  const startGame = async () => {
    if (!scenario || !user) return;

    try {
      // Create match on backend
      const matchRes = await matchesAPI.createMatch(scenario._id);
      setMatchId(matchRes.data._id);

      setGameState("playing");
      setCurrentWeek(0);
      setRoundPhase("reveal");

      // Auto-start first round logic
      startRound();
    } catch (error) {
      console.error("Failed to start match:", error);
    }
  };

  const startRound = () => {
    setRoundPhase("reveal");
    setShowNews(true);

    // Switch to decision phase after reveal
    setTimeout(() => {
      setRoundPhase("decision");
    }, (ROUND_DURATION - DECISION_DURATION) * 1000);
  };

  const handleRoundComplete = () => {
    // If no action taken, treat as HOLD
    if (roundPhase === "decision") {
      handleTrade("HOLD");
    }
  };

  const handleTrade = (action: "BUY" | "SELL" | "HOLD") => {
    if (!scenario) return;

    const gameCandle = scenario.gameCandles[currentWeek];
    const price = gameCandle.close;

    let newTrade: Trade = {
      week: currentWeek,
      action,
      price,
      timestamp: new Date(),
    };

    let newCash = availableCash;
    let newPosition = position ? { ...position } : null;

    if (action === "BUY") {
      if (selectedShares > 0) {
        const cost = selectedShares * price;
        // Allow buying if we have cash (Long) OR if we are covering a short (reducing negative shares)
        // Ideally we check margin, but simpler: Can only Open Long if Cash >= Cost.
        // Covering Short: Always allow if we have the cash (Cost) but wait, covering reduces cash.

        // Simplified Rule: 
        // 1. If Position >= 0 (Long or Flat): Need Cash >= Cost.
        // 2. If Position < 0 (Short): We are buying back. Need Cash >= Cost? Yes, usually.

        if (newCash >= cost) {
          newCash -= cost; // Cash decreases

          if (!newPosition) {
            // Open Long
            newPosition = { shares: selectedShares, entryPrice: price, entryWeek: currentWeek };
          } else {
            // Add to Long or Cover Short
            const totalShares = newPosition.shares + selectedShares;

            if (totalShares === 0) {
              // Closed completely
              // PnL = (Entry - Exit) * Abs(Shares) -- Wait, let's just calc realized PnL on close
              // Short PnL: (Entry - BuyPrice) * Abs(OldShares)
              const pnl = (newPosition.entryPrice - price) * Math.abs(newPosition.shares);
              newTrade.pnl = pnl;
              newPosition = null;

              // Note: For shorts, 'entryPrice' was the Sell Price.
            } else if (newPosition.shares < 0) {
              // Partial Cover
              // PnL on the covered portion?
              // (Entry - Price) * SharesCovered
              const pnl = (newPosition.entryPrice - price) * selectedShares;
              newTrade.pnl = pnl;

              newPosition.shares = totalShares;
              // Entry price stays same for remaining short
            } else {
              // Adding to Long
              newPosition = {
                shares: totalShares,
                entryPrice: ((newPosition.shares * newPosition.entryPrice) + cost) / totalShares,
                entryWeek: newPosition.entryWeek
              };
            }
          }
          newTrade.shares = selectedShares;
        } else {
          alert("Not enough cash!"); // Simple feedback
          return;
        }
      }
    } else if (action === "SELL") {
      if (selectedShares > 0) {
        const proceeds = selectedShares * price;
        newCash += proceeds; // Cash increases

        if (!newPosition) {
          // Open Short
          // Margin Check: Can't short more than 1x Cash?
          // Current Equity = Cash. Max Short Value = Cash.
          if (proceeds <= availableCash) {
            newPosition = { shares: -selectedShares, entryPrice: price, entryWeek: currentWeek };
          } else {
            alert("Margin limit reached (1x leverage)");
            return;
          }
        } else {
          // Add to Short or Sell Long
          const totalShares = newPosition.shares - selectedShares;

          if (totalShares === 0) {
            // Closed Long
            const pnl = (price - newPosition.entryPrice) * newPosition.shares;
            newTrade.pnl = pnl;
            newPosition = null;
          } else if (newPosition.shares > 0) {
            // Partial Sell Long
            const pnl = (price - newPosition.entryPrice) * selectedShares;
            newTrade.pnl = pnl;
            newPosition.shares = totalShares;
            // Entry price stays same
          } else {
            // Adding to Short
            // Check margin again?
            const currentShortValue = Math.abs(newPosition.shares) * price;
            const newShortValue = currentShortValue + proceeds;
            // Approx Margin check
            if (newShortValue <= (newCash - proceeds)) { // Check against old cash base?
              // Let's use simplified: Total Short Value <= Total Cash
              // newCash is already inflated by proceeds.
              // Equity = newCash - newShortValue.
              // Keep it simple: Open Short Limit
              newPosition = {
                shares: totalShares,
                entryPrice: ((Math.abs(newPosition.shares) * newPosition.entryPrice) + proceeds) / Math.abs(totalShares),
                entryWeek: newPosition.entryWeek
              };
            } else {
              // Allow for now to avoid blocking mid-game, or implement stricter check later
              newPosition = {
                shares: totalShares,
                entryPrice: ((Math.abs(newPosition.shares) * newPosition.entryPrice) + proceeds) / Math.abs(totalShares),
                entryWeek: newPosition.entryWeek
              };
            }
          }
        }
        newTrade.shares = selectedShares;
      }
    }

    setTrades([...trades, newTrade]);
    setAvailableCash(newCash);
    setPosition(newPosition);
    setSelectedShares(0); // Reset input

    // Advance to next week or end game
    if (currentWeek < 3) {
      setCurrentWeek(prev => prev + 1);
      startRound();
    } else {
      // Calculate Final Equity correctly
      let finalEquity = newCash;
      if (newPosition) {
        // Close position at last price
        const lastPrice = scenario.gameCandles[3].close;
        // Equity = Cash + (Shares * Price)
        // If Long: Cash + (Pos * Price)
        // If Short: Cash + (Neg * Price) -> Cash - (Pos * Price)
        finalEquity += newPosition.shares * lastPrice;
      }
      endGame(finalEquity, newPosition);
    }
  };

  const endGame = async (finalEquity: number, finalPos: any) => {
    if (!scenario || !matchId) return;

    // Auto-close position at end
    let calculatedEquity = finalEquity;
    if (finalPos) {
      const lastPrice = scenario.gameCandles[3].close;
      const proceeds = finalPos.shares * lastPrice;
      calculatedEquity += proceeds;

      // Record implicit sell
      const closeTrade: Trade = {
        week: 3,
        action: "SELL",
        price: lastPrice,
        shares: finalPos.shares,
        pnl: proceeds - (finalPos.shares * finalPos.entryPrice),
        timestamp: new Date(),
      };
      setTrades(prev => [...prev, closeTrade]);
    }

    setAvailableCash(calculatedEquity);
    setGameState("completed");

    try {
      await matchesAPI.updateMatch(matchId, {
        player1FinalEquity: calculatedEquity,
        player1Trades: trades,
        status: "completed"
      });
    } catch (error) {
      console.error("Failed to save match results:", error);
    }
  };

  // Chart Data Preparation


  if (loading || isLoadingScenario || !scenario) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="animate-spin mb-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full" />
        </div>
        <p className="text-gray-400">Loading market data...</p>
      </div>
    );
  }

  // --- READY STATE ---
  if (gameState === "ready") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 text-center max-w-3xl"
        >
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Market Challenge
          </h1>

          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <BarChart2 className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold">3 Months Context</h3>
              <p className="text-sm text-gray-400">Analyze the trend before you trade</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold">4 Weeks</h3>
              <p className="text-sm text-gray-400">Make quick decisions each week</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold">$100k Starting</h3>
              <p className="text-sm text-gray-400">Grow your portfolio to win</p>
            </div>
          </div>

          <motion.button
            onClick={startGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-12 py-5 rounded-full bg-white text-black font-bold text-xl hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all flex items-center gap-3 mx-auto"
          >
            <Play className="w-6 h-6 fill-black" />
            Start Match
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // --- PLAYING STATE ---
  if (gameState === "playing") {
    const currentCandle = scenario.gameCandles[currentWeek];
    const news = scenario.news.find(n => n.week === currentWeek + 1); // Week is 1-indexed in news

    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded bg-purple-500/20 text-purple-300 text-sm font-bold">
              Week {currentWeek + 1} / 4
            </div>
            {roundPhase === "decision" && (
              <div className="w-64">
                <GameTimer
                  duration={DECISION_DURATION}
                  isActive={true}
                  onComplete={handleRoundComplete}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Equity</p>
              <p className="text-2xl font-mono font-bold text-green-400">
                ${(availableCash + (position ? position.shares * currentCandle.close : 0)).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Cash</p>
              <p className="text-xl font-mono text-gray-300">${availableCash.toLocaleString()}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Chart Area */}
          <div className="flex-1 p-6 relative flex flex-col">
            <div className="flex-1 min-h-[400px] flex flex-col">
              <GameChart
                contextCandles={scenario.contextCandles}
                gameCandles={scenario.gameCandles}
                currentWeek={currentWeek}
                gameState={gameState}
              />
            </div>

            {/* News Overlay */}
            <AnimatePresence>
              {showNews && news && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl max-w-2xl mx-auto"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
                      <BarChart2 size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm text-blue-300 font-bold mb-1 uppercase tracking-wider">Breaking News</h4>
                      <p className="text-xl font-medium leading-relaxed">{news.headline}</p>
                      <p className="text-sm text-gray-400 mt-2">{new Date(news.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Controls */}
          <div className="w-96 border-l border-white/10 bg-black/20 backdrop-blur p-6 flex flex-col gap-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Current Price</p>
              <p className="text-4xl font-bold text-white">${currentCandle.close.toFixed(2)}</p>
              <div className={`flex items - center gap - 2 mt - 2 text - sm ${currentCandle.close >= currentCandle.open ? 'text-green-400' : 'text-red-400'} `}>
                {currentCandle.close >= currentCandle.open ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {((currentCandle.close - currentCandle.open) / currentCandle.open * 100).toFixed(2)}%
              </div>
            </div>

            {position && (
              <div className={`p-4 rounded-xl border ${position.shares > 0 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`${position.shares > 0 ? 'text-purple-300' : 'text-orange-300'} font-bold`}>Current Position</span>
                  <span className={`text-xs px-2 py-1 rounded ${position.shares > 0 ? 'bg-purple-500/20 text-purple-300' : 'bg-orange-500/20 text-orange-300'}`}>
                    {position.shares > 0 ? 'LONG' : 'SHORT'}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Shares</span>
                  <span className="text-white">{Math.abs(position.shares)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg {position.shares > 0 ? 'Entry' : 'Sold'}</span>
                  <span className="text-white">${position.entryPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col justify-end gap-4">
              <ShareInput
                price={currentCandle.close}
                maxCapital={availableCash}
                onChange={setSelectedShares}
                disabled={roundPhase !== "decision"}
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleTrade("BUY")}
                  disabled={roundPhase !== "decision" || selectedShares === 0}
                  className="py-4 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 text-white font-bold transition flex flex-col items-center gap-1"
                >
                  <span className="text-lg">
                    {position?.shares && position.shares < 0 ? 'COVER' : 'BUY'}
                  </span>
                  <span className="text-xs opacity-75 font-normal">
                    {position?.shares && position.shares < 0 ? 'Close Short' : 'Long'}
                  </span>
                </button>

                <button
                  onClick={() => handleTrade("SELL")}
                  disabled={roundPhase !== "decision" || selectedShares === 0}
                  className="py-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-bold transition flex flex-col items-center gap-1"
                >
                  <span className="text-lg">
                    {position?.shares && position.shares > 0 ? 'SELL' : 'SHORT'}
                  </span>
                  <span className="text-xs opacity-75 font-normal">
                    {position?.shares && position.shares > 0 ? 'Close Long' : 'Sell to Open'}
                  </span>
                </button>
              </div>

              <button
                onClick={() => handleTrade("HOLD")}
                disabled={roundPhase !== "decision"}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-gray-300 font-medium transition"
              >
                DO NOTHING (HOLD)
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- COMPLETED STATE ---
  if (gameState === "completed") {
    const totalReturn = ((availableCash - 100000) / 100000) * 100;

    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="z-10 max-w-4xl w-full bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="p-8 border-b border-white/10 text-center">
            <h2 className="text-gray-400 uppercase tracking-widest text-sm mb-2">The Stock Was</h2>
            <h1 className="text-6xl font-black text-white mb-2">{scenario.ticker}</h1>
            <p className="text-xl text-purple-400">
              {new Date(scenario.startDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              {' - '}
              {new Date(scenario.endDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="grid grid-cols-2 divide-x divide-white/10">
            <div className="p-8 flex flex-col justify-center items-center">
              <p className="text-gray-400 mb-2">Final Portfolio Value</p>
              <p className="text-5xl font-bold text-white mb-4">${availableCash.toLocaleString()}</p>
              <div className={`px - 4 py - 2 rounded - full text - lg font - bold ${totalReturn >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} `}>
                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}% Return
              </div>
            </div>

            <div className="p-8">
              <h3 className="text-lg font-bold mb-4 text-gray-300">Performance Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Trades</span>
                  <span>{trades.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Best Trade</span>
                  <span className={(() => {
                    const pnlTrades = trades.filter(t => typeof t.pnl === 'number');
                    if (pnlTrades.length === 0) return 'text-gray-400';
                    const best = Math.max(...pnlTrades.map(t => t.pnl!));
                    return best >= 0 ? 'text-green-400' : 'text-red-400';
                  })()}>
                    {(() => {
                      const pnlTrades = trades.filter(t => typeof t.pnl === 'number');
                      if (pnlTrades.length === 0) return 'N/A';
                      const best = Math.max(...pnlTrades.map(t => t.pnl!));
                      return (best >= 0 ? '+' : '') + '$' + best.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Difficulty</span>
                  <span className="capitalize">{scenario.difficulty.toLowerCase()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white/5 border-t border-white/10 flex justify-center gap-4">
            <Link href="/dashboard">
              <button className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition font-bold">
                Dashboard
              </button>
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition font-bold"
            >
              Play Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}

