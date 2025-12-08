"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, TrendingUp, TrendingDown, Clock, DollarSign, BarChart2, Users, Copy, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { scenariosAPI, matchesAPI } from "@/lib/api";
import GameTimer from "@/components/GameTimer";
import ShareInput from "@/components/ShareInput";
import GameChart from "@/components/GameChart";
import Lobby from "@/components/Lobby";
import LeverageSlider from "@/components/LeverageSlider";
import { io, Socket } from "socket.io-client";
import TutorialOverlay from "@/components/TutorialOverlay";

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
    source?: string;
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

type GamePhase = "lobby" | "waiting" | "playing" | "completed" | "error";
type RoundPhase = "reveal" | "decision" | "waiting_for_next_round" | "countdown";

const ROUND_DURATION = 24; // Total seconds per week
const DECISION_DURATION = 18; // Seconds for decision

interface GameManagerProps {
    initialJoinCode?: string;
}

export default function GameManager({ initialJoinCode }: GameManagerProps) {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();

    // Game State
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const [gameState, setGameState] = useState<GamePhase>("lobby");
    const [currentWeek, setCurrentWeek] = useState(0);
    const [roundPhase, setRoundPhase] = useState<RoundPhase>("countdown");
    const [matchData, setMatchData] = useState<any>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [opponent, setOpponent] = useState<any>(null);
    const [hasTradedThisRound, setHasTradedThisRound] = useState(false);
    const [roundEndTime, setRoundEndTime] = useState<number>(0);

    // Trading State
    const [availableCash, setAvailableCash] = useState(100000);
    const [position, setPosition] = useState<{ shares: number; entryPrice: number; entryWeek: number } | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [selectedShares, setSelectedShares] = useState(0);
    const [leverage, setLeverage] = useState(1);

    // UI State
    const [isLoadingScenario, setIsLoadingScenario] = useState(false);
    const [showNews, setShowNews] = useState(false);
    const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [countdownSeconds, setCountdownSeconds] = useState(0);

    // Auth Check
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, loading, router]);

    // Auto-join logic
    useEffect(() => {
        if (initialJoinCode && isAuthenticated && !autoJoinAttempted && gameState === "lobby") {
            setAutoJoinAttempted(true);
            handleJoinWithCode(initialJoinCode);
        }
    }, [initialJoinCode, isAuthenticated, autoJoinAttempted, gameState]);

    const handleJoinWithCode = async (code: string) => {
        try {
            const response = await matchesAPI.joinMatch(code);
            handleMatchStart(response.data);
        } catch (error) {
            console.error("Auto-join failed:", error);
            alert("Failed to join match with code: " + code);
        }
    };

    // Reset trade state on new week
    useEffect(() => {
        setHasTradedThisRound(false);
    }, [currentWeek]);

    // Socket Cleanup
    useEffect(() => {
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [socket]);

    const handleMatchStart = async (match: any) => {
        setMatchData(match);

        // Connect Socket
        const newSocket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket');
            newSocket.emit('join_match', { matchId: match._id, userId: user?._id });
        });

        newSocket.on('player_joined', (data: any) => {
            console.log('Player joined:', data);
            // If we are waiting and someone joins, we might update UI
        });

        newSocket.on('match_ready', async () => {
            console.log('Match Ready!');
            // Check if scenario is embedded in match data (new AI-generated scenarios)
            if (match.stockScenario && typeof match.stockScenario === 'object' && match.stockScenario.contextCandles) {
                console.log('Using embedded scenario from match');
                setScenario(match.stockScenario);
            } else {
                // Fall back to fetching by ID for legacy matches
                await fetchScenario(match.stockScenario?._id || match.stockScenario);
            }
            setGameState("playing");
            setCurrentWeek(0);
            // Don't set roundPhase here - let the server's match_state control the phase
            // The server will send 'countdown' first, then 'reveal'
        });

        newSocket.on('match_state', (state: any) => {
            console.log('Match State Update:', state);
            setCurrentWeek(state.currentWeek);
            setRoundPhase(state.phase);
            setRoundEndTime(state.endTime);

            if (state.phase === 'countdown') {
                // Calculate countdown seconds from endTime
                const remaining = Math.ceil((state.endTime - Date.now()) / 1000);
                setCountdownSeconds(remaining > 0 ? remaining : 0);
                // Start a local countdown interval
                const interval = setInterval(() => {
                    const left = Math.ceil((state.endTime - Date.now()) / 1000);
                    setCountdownSeconds(left > 0 ? left : 0);
                    if (left <= 0) clearInterval(interval);
                }, 100);
            } else if (state.phase === 'reveal') {
                setHasTradedThisRound(false);
                setShowNews(true);
                setCountdownSeconds(0);
            } else if (state.phase === 'decision') {
                setShowNews(false);
            } else if (state.phase === 'completed') {
                setGameState("completed");
            }
        });

        newSocket.on('opponent_trade', (data: any) => {
            console.log('Opponent traded:', data);
            setOpponent((prev: any) => ({
                ...prev,
                lastAction: data.action,
                equity: data.equity // Assuming we send equity now
            }));
        });

        setGameState("waiting");
    };

    const fetchScenario = async (scenarioId: string) => {
        if (!scenarioId) {
            console.error("No scenarioId provided");
            setGameState("error");
            return;
        }
        try {
            setIsLoadingScenario(true);
            const response = await scenariosAPI.getScenarioById(scenarioId);
            setScenario(response.data);
        } catch (error) {
            console.error("Failed to fetch scenario:", error);
            setGameState("error");
        } finally {
            setIsLoadingScenario(false);
        }
    };

    const startRound = () => {
        // Deprecated: Server drives the round
    };

    const handleRoundComplete = () => {
        // If no action taken by the time the timer ends, force a HOLD
        // The server will advance the week regardless, but we need to record the trade
        if (!hasTradedThisRound && roundPhase === 'decision') {
            handleTrade("HOLD", true);
        }
    };

    const advanceWeek = () => {
        // Deprecated: Server drives the week advancement
    };

    const handleTrade = (action: "BUY" | "SELL" | "HOLD", isForced = false) => {
        if (!scenario) return;
        if (hasTradedThisRound && !isForced) return; // Prevent double trading

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
        let pnl = 0;

        if (action === "BUY") {
            if (selectedShares > 0) {
                const positionValue = selectedShares * price;
                const marginRequired = positionValue / leverage;

                if (!newPosition) {
                    // Opening new LONG position
                    if (newCash >= marginRequired) {
                        newCash -= marginRequired;
                        newPosition = { shares: selectedShares, entryPrice: price, entryWeek: currentWeek };
                        newTrade.shares = selectedShares;
                    } else {
                        alert("Not enough cash for margin!");
                        return;
                    }
                } else if (newPosition.shares < 0) {
                    // Covering SHORT position
                    const sharesToCover = Math.min(selectedShares, Math.abs(newPosition.shares));
                    const remainingBuyShares = selectedShares - sharesToCover;

                    // PnL from covering short: (entry - current) * shares covered
                    pnl = (newPosition.entryPrice - price) * sharesToCover;
                    newTrade.pnl = pnl;
                    newTrade.shares = selectedShares;

                    // Return margin from closed short + PnL
                    const marginReturned = (sharesToCover * newPosition.entryPrice) / leverage;
                    newCash += marginReturned + pnl;

                    const totalShares = newPosition.shares + sharesToCover;

                    if (totalShares === 0) {
                        newPosition = null;
                    } else {
                        newPosition.shares = totalShares;
                    }

                    // If buying more than covering, open new long
                    if (remainingBuyShares > 0 && newPosition === null) {
                        const newMargin = (remainingBuyShares * price) / leverage;
                        if (newCash >= newMargin) {
                            newCash -= newMargin;
                            newPosition = { shares: remainingBuyShares, entryPrice: price, entryWeek: currentWeek };
                        }
                    }
                } else {
                    // Adding to LONG position
                    const additionalMargin = positionValue / leverage;
                    if (newCash >= additionalMargin) {
                        newCash -= additionalMargin;
                        const totalShares = newPosition.shares + selectedShares;
                        const totalCost = (newPosition.shares * newPosition.entryPrice) + positionValue;
                        newPosition = {
                            shares: totalShares,
                            entryPrice: totalCost / totalShares,
                            entryWeek: newPosition.entryWeek
                        };
                        newTrade.shares = selectedShares;
                    } else {
                        alert("Not enough cash for margin!");
                        return;
                    }
                }
            }
        } else if (action === "SELL") {
            // Determine shares to sell: use selectedShares if set, otherwise sell entire position if exists
            let sharesToUse = selectedShares;
            if (sharesToUse === 0 && newPosition && newPosition.shares > 0) {
                // Default to selling entire long position
                sharesToUse = newPosition.shares;
            }

            if (sharesToUse > 0) {
                const positionValue = sharesToUse * price;
                const marginRequired = positionValue / leverage;

                if (!newPosition) {
                    // Opening new SHORT position
                    if (newCash >= marginRequired) {
                        newCash -= marginRequired;
                        newPosition = { shares: -sharesToUse, entryPrice: price, entryWeek: currentWeek };
                        newTrade.shares = sharesToUse;
                    } else {
                        alert("Not enough cash for margin!");
                        return;
                    }
                } else if (newPosition.shares > 0) {
                    // Closing LONG position
                    const sharesToSell = Math.min(sharesToUse, newPosition.shares);
                    const remainingSellShares = sharesToUse - sharesToSell;

                    // PnL from selling long: (current - entry) * shares sold
                    pnl = (price - newPosition.entryPrice) * sharesToSell;
                    newTrade.pnl = pnl;
                    newTrade.shares = sharesToUse;

                    // Return margin from closed long + PnL
                    const marginReturned = (sharesToSell * newPosition.entryPrice) / leverage;
                    newCash += marginReturned + pnl;

                    const totalShares = newPosition.shares - sharesToSell;

                    if (totalShares === 0) {
                        newPosition = null;
                    } else {
                        newPosition.shares = totalShares;
                    }

                    // If selling more than position, open new short
                    if (remainingSellShares > 0 && newPosition === null) {
                        const newMargin = (remainingSellShares * price) / leverage;
                        if (newCash >= newMargin) {
                            newCash -= newMargin;
                            newPosition = { shares: -remainingSellShares, entryPrice: price, entryWeek: currentWeek };
                        }
                    }
                } else {
                    // Adding to SHORT position
                    const additionalMargin = positionValue / leverage;
                    if (newCash >= additionalMargin) {
                        newCash -= additionalMargin;
                        const totalShares = newPosition.shares - sharesToUse;
                        const totalValue = (Math.abs(newPosition.shares) * newPosition.entryPrice) + positionValue;
                        newPosition = {
                            shares: totalShares,
                            entryPrice: totalValue / Math.abs(totalShares),
                            entryWeek: newPosition.entryWeek
                        };
                        newTrade.shares = sharesToUse;
                    } else {
                        alert("Not enough cash for margin!");
                        return;
                    }
                }
            }
        }

        setTrades([...trades, newTrade]);
        setAvailableCash(newCash);
        setPosition(newPosition);
        setSelectedShares(0);
        setHasTradedThisRound(true);
        setRoundPhase("waiting_for_next_round");

        // Calculate current equity for broadcast
        // Equity = Cash + Margin held in position + Unrealized PnL
        let currentEquity = newCash;
        if (newPosition) {
            const marginInPosition = (Math.abs(newPosition.shares) * newPosition.entryPrice) / leverage;
            const unrealizedPnL = newPosition.shares > 0
                ? (price - newPosition.entryPrice) * newPosition.shares  // Long PnL
                : (newPosition.entryPrice - price) * Math.abs(newPosition.shares); // Short PnL
            currentEquity = newCash + marginInPosition + unrealizedPnL;
        }

        // Emit trade to opponent
        if (socket && matchData) {
            socket.emit('trade_action', {
                matchId: matchData._id,
                playerId: user?._id,
                action,
                price,
                week: currentWeek,
                pnl,
                shares: selectedShares,
                equity: currentEquity
            });
        }

        // Check for Game Over locally if it's the last week
        if (currentWeek >= 3) {
            const lastPrice = scenario.gameCandles[3].close;
            let finalEquity = newCash;
            if (newPosition) {
                // Close position at market - return margin + final PnL
                const marginInPosition = (Math.abs(newPosition.shares) * newPosition.entryPrice) / leverage;
                const finalPnL = newPosition.shares > 0
                    ? (lastPrice - newPosition.entryPrice) * newPosition.shares
                    : (newPosition.entryPrice - lastPrice) * Math.abs(newPosition.shares);
                finalEquity = newCash + marginInPosition + finalPnL;
            }
            endGame(finalEquity, newPosition);
        }
    };

    const endGame = async (finalEquity: number, finalPos: any) => {
        if (!scenario || !matchData) return;

        let calculatedEquity = finalEquity;
        let finalTrades = [...trades]; // Create a copy of trades

        if (finalPos) {
            const lastPrice = scenario.gameCandles[3].close;

            const closeTrade: Trade = {
                week: 3,
                action: finalPos.shares > 0 ? "SELL" : "BUY", // Sell if long, Buy to cover if short
                price: lastPrice,
                shares: Math.abs(finalPos.shares),
                pnl: finalPos.shares > 0
                    ? (lastPrice - finalPos.entryPrice) * finalPos.shares  // Long PnL
                    : (finalPos.entryPrice - lastPrice) * Math.abs(finalPos.shares), // Short PnL
                timestamp: new Date(),
            };
            finalTrades.push(closeTrade); // Add closeTrade to our local copy
            setTrades(finalTrades); // Update state with all trades
        }

        setAvailableCash(finalEquity);
        setGameState("completed");

        try {
            await matchesAPI.updateMatch(matchData._id, {
                [matchData.player1.userId.toString() === user?._id?.toString() ? 'player1FinalEquity' : 'player2FinalEquity']: calculatedEquity,
                [matchData.player1.userId.toString() === user?._id?.toString() ? 'player1Trades' : 'player2Trades']: finalTrades, // Use finalTrades
                status: "completed"
            });
        } catch (error) {
            console.error("Failed to save match results:", error);
        }

        // Fetch AI analysis after game completion
        try {
            setIsLoadingAnalysis(true);
            const response = await scenariosAPI.analyzeGame(finalTrades, scenario.gameCandles, finalEquity); // Use finalTrades
            setAiAnalysis(response.data.analysis);
        } catch (error) {
            console.error("Failed to get AI analysis:", error);
            setAiAnalysis(null);
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <div className="animate-spin mb-4">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full" />
                </div>
            </div>
        );
    }

    // --- LOBBY STATE ---
    if (gameState === "lobby") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
                <TutorialOverlay onComplete={() => { }} />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />

                <div className="z-10 w-full max-w-md">
                    <h1 className="text-5xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        StockGuessr
                    </h1>
                    <Lobby onMatchStart={handleMatchStart} />
                </div>
            </div>
        );
    }

    // --- WAITING STATE ---
    if (gameState === "waiting") {
        const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/game/${matchData?.joinCode}` : '';

        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                <div className="z-10 text-center">
                    <div className="mb-8 relative">
                        <div className="w-24 h-24 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Users className="w-8 h-8 text-purple-400" />
                        </div>
                    </div>


                    <h2 className="text-3xl font-bold text-white mb-4">Waiting for Opponent</h2>

                    {matchData?.joinCode && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-sm mx-auto backdrop-blur">
                            <p className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Game Code</p>
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <span className="text-5xl font-mono font-bold text-white tracking-widest">
                                    {matchData.joinCode}
                                </span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(matchData.joinCode)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition"
                                    title="Copy Code"
                                >
                                    <Copy className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                <span className="text-xs text-gray-500">Or share link:</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                                    className="text-xs text-purple-400 hover:text-purple-300 underline"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- PLAYING STATE ---
    if (gameState === "playing" && scenario) {
        const currentCandle = scenario.gameCandles[currentWeek];
        const currentWeekNews = scenario.news.filter(n => n.week === currentWeek + 1);

        return (
            <div className="min-h-screen bg-black text-white flex flex-col">
                {/* Countdown Overlay */}
                {roundPhase === 'countdown' && countdownSeconds > 0 && (
                    <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center">
                        <div className="text-center">
                            <p className="text-gray-400 text-lg mb-4">Game Starting In</p>
                            <div className="text-9xl font-black text-purple-500 animate-pulse">
                                {countdownSeconds}
                            </div>
                            <p className="text-gray-500 text-sm mt-6">Get ready to trade!</p>
                        </div>
                    </div>
                )}
                {/* Top Bar */}
                <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 rounded bg-purple-500/20 text-purple-300 text-sm font-bold">
                            Week {currentWeek + 1} / 4
                        </div>
                        {/* Phase Indicator */}
                        {roundPhase === "reveal" && (
                            <div className="px-3 py-1 rounded bg-blue-500/20 text-blue-300 text-sm font-bold flex items-center gap-2 animate-pulse">
                                <span>📊</span> REVEAL PHASE
                            </div>
                        )}
                        {roundPhase === "decision" && (
                            <div className="px-3 py-1 rounded bg-green-500/20 text-green-300 text-sm font-bold flex items-center gap-2">
                                <span>💹</span> MAKE YOUR TRADE
                            </div>
                        )}
                        {roundPhase === "waiting_for_next_round" && (
                            <div className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-300 text-sm font-bold flex items-center gap-2">
                                <span>⏳</span> WAITING...
                            </div>
                        )}
                        <div className="w-48">
                            <GameTimer
                                duration={DECISION_DURATION}
                                endTime={roundEndTime}
                                isActive={roundPhase === "decision" || roundPhase === "waiting_for_next_round" || roundPhase === "reveal"}
                                onComplete={handleRoundComplete}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* Opponent Score */}
                        {opponent && (
                            <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Opponent</p>
                                    <div className="flex items-center justify-end gap-2">
                                        <span className={`text-sm font-bold ${((opponent.equity - 100000) / 100000 * 100) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {((opponent.equity - 100000) / 100000 * 100) >= 0 ? '+' : ''}
                                            {((opponent.equity - 100000) / 100000 * 100).toFixed(2)}%
                                        </span>
                                        <p className="text-lg font-mono font-bold text-gray-400">
                                            ${opponent.equity?.toLocaleString() || '100,000'}
                                        </p>
                                    </div>
                                </div>
                                <Swords className="w-5 h-5 text-gray-600" />
                            </div>
                        )}

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Equity</p>
                                <p className="text-xl font-mono font-bold text-green-400">
                                    ${(() => {
                                        let equity = availableCash;
                                        if (position) {
                                            const marginInPosition = (Math.abs(position.shares) * position.entryPrice) / leverage;
                                            const unrealizedPnL = position.shares > 0
                                                ? (currentCandle.close - position.entryPrice) * position.shares
                                                : (position.entryPrice - currentCandle.close) * Math.abs(position.shares);
                                            equity = availableCash + marginInPosition + unrealizedPnL;
                                        }
                                        return equity.toLocaleString();
                                    })()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Cash</p>
                                <p className="text-lg font-mono text-gray-300">${availableCash.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* News Ticker - Scrollable at top center */}
                {currentWeekNews.length > 0 && (
                    <div className="border-b border-white/10 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-blue-900/20">
                        <div className="max-w-4xl mx-auto py-3 px-6">
                            <div className="flex items-center gap-3 mb-2">
                                <BarChart2 className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Market News</span>
                            </div>
                            <div className="max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                <div className="space-y-2">
                                    {currentWeekNews.map((newsItem, idx) => (
                                        <div key={idx} className="flex items-start gap-3 text-sm">
                                            <span className="text-gray-500 text-xs min-w-[60px]">
                                                {new Date(newsItem.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                            <p className="text-gray-200 leading-snug flex-1">{newsItem.headline}</p>
                                            {newsItem.source && (
                                                <span className="text-gray-500 text-xs">{newsItem.source}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <main className="flex-1 flex overflow-hidden">
                    {/* Chart Area */}
                    <div className="flex-1 p-4 relative flex flex-col">
                        <div className="flex-1 min-h-[350px] flex flex-col">
                            <GameChart
                                contextCandles={scenario.contextCandles}
                                gameCandles={scenario.gameCandles}
                                currentWeek={currentWeek}
                                gameState={gameState}
                            />
                        </div>
                    </div>

                    {/* Sidebar Controls */}
                    <div className="w-80 border-l border-white/10 bg-black/20 backdrop-blur p-4 flex flex-col gap-4">
                        {/* Current Price - Compact */}
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-xs text-gray-400 mb-1">Current Price</p>
                            <p className="text-3xl font-bold text-white">${currentCandle.close.toFixed(2)}</p>
                            <div className={`flex items-center gap-1 mt-1 text-sm ${currentCandle.close >= currentCandle.open ? 'text-green-400' : 'text-red-400'}`}>
                                {currentCandle.close >= currentCandle.open ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {((currentCandle.close - currentCandle.open) / currentCandle.open * 100).toFixed(2)}%
                            </div>
                        </div>

                        {/* Position */}
                        {position && (
                            <div className={`p-3 rounded-xl border ${position.shares > 0 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`${position.shares > 0 ? 'text-purple-300' : 'text-orange-300'} font-bold text-sm`}>Position</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${position.shares > 0 ? 'bg-purple-500/20 text-purple-300' : 'bg-orange-500/20 text-orange-300'}`}>
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

                        {/* Trading Controls */}
                        <div className="flex-1 flex flex-col justify-end gap-3">
                            <LeverageSlider
                                value={leverage}
                                onChange={setLeverage}
                                disabled={roundPhase !== "decision" || hasTradedThisRound || !!position}
                            />

                            <ShareInput
                                price={currentCandle.close}
                                maxCapital={availableCash}
                                onChange={setSelectedShares}
                                disabled={roundPhase !== "decision" || hasTradedThisRound}
                                leverage={leverage}
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleTrade("BUY")}
                                    disabled={roundPhase !== "decision" || selectedShares === 0 || hasTradedThisRound}
                                    className="py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 text-white font-bold transition flex flex-col items-center gap-0.5"
                                >
                                    <span className="text-base">
                                        {position?.shares && position.shares < 0 ? 'COVER' : 'BUY'}
                                    </span>
                                    <span className="text-xs opacity-75 font-normal">
                                        {position?.shares && position.shares < 0 ? 'Close Short' : 'Long'}
                                    </span>
                                </button>

                                <button
                                    onClick={() => handleTrade("SELL")}
                                    disabled={roundPhase !== "decision" || (selectedShares === 0 && !(position && position.shares > 0)) || hasTradedThisRound}
                                    className="py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-bold transition flex flex-col items-center gap-0.5"
                                >
                                    <span className="text-base">
                                        {position?.shares && position.shares > 0 ? 'SELL' : 'SHORT'}
                                    </span>
                                    <span className="text-xs opacity-75 font-normal">
                                        {position?.shares && position.shares > 0 ? 'Close Long' : 'Sell to Open'}
                                    </span>
                                </button>
                            </div>

                            <button
                                onClick={() => handleTrade("HOLD")}
                                disabled={roundPhase !== "decision" || hasTradedThisRound}
                                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-gray-300 font-medium transition text-sm"
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
    if (gameState === "completed" && scenario) {
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
                        {/* Player Stats */}
                        <div className="p-8 flex flex-col justify-center items-center relative">
                            {availableCash > (opponent?.equity || 0) && (
                                <div className="absolute top-4 right-4 text-yellow-400 animate-pulse">
                                    <Trophy className="w-8 h-8" />
                                </div>
                            )}
                            <p className="text-gray-400 mb-2 uppercase tracking-widest text-xs">You</p>
                            <div className="text-5xl font-bold text-white mb-4">${availableCash.toLocaleString()}</div>
                            <div className={`px-4 py-2 rounded-full text-lg font-bold ${totalReturn >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}% Return
                            </div>
                            {availableCash > (opponent?.equity || 0) && (
                                <div className="mt-4 text-green-400 font-bold text-xl">VICTORY</div>
                            )}
                        </div>

                        {/* Opponent Stats */}
                        <div className="p-8 flex flex-col justify-center items-center relative">
                            {(opponent?.equity || 0) > availableCash && (
                                <div className="absolute top-4 left-4 text-yellow-400 animate-pulse">
                                    <Trophy className="w-8 h-8" />
                                </div>
                            )}
                            <p className="text-gray-400 mb-2 uppercase tracking-widest text-xs">Opponent</p>
                            {opponent ? (
                                <>
                                    <div className="text-5xl font-bold text-gray-300 mb-4">${opponent.equity.toLocaleString()}</div>
                                    <div className={`px-4 py-2 rounded-full text-lg font-bold ${((opponent.equity - 100000) / 100000 * 100) >= 0 ? 'bg-green-500/10 text-green-500/70' : 'bg-red-500/10 text-red-500/70'}`}>
                                        {((opponent.equity - 100000) / 100000 * 100) >= 0 ? '+' : ''}
                                        {((opponent.equity - 100000) / 100000 * 100).toFixed(2)}% Return
                                    </div>
                                    {(opponent.equity > availableCash) && (
                                        <div className="mt-4 text-red-400 font-bold text-xl">WINNER</div>
                                    )}
                                </>
                            ) : (
                                <div className="text-gray-500 italic">Waiting for opponent results...</div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-white/10 p-8">
                        <h3 className="text-lg font-bold mb-4 text-gray-300 text-center">AI Performance Analysis</h3>
                        {isLoadingAnalysis ? (
                            <p className="text-gray-400 text-sm mt-2 italic text-center">Analyzing your trading strategy...</p>
                        ) : aiAnalysis ? (
                            <div className="text-gray-200 text-sm mt-2 leading-relaxed max-w-2xl mx-auto bg-white/5 p-6 rounded-xl border border-white/5">
                                {aiAnalysis}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm mt-2 italic text-center">Analysis unavailable</p>
                        )}
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
