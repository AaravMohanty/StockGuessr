"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ArrowRight, Users, Play } from "lucide-react";
import { matchesAPI } from "@/lib/api";

interface LobbyProps {
    onMatchStart: (matchData: any) => void;
}

export default function Lobby({ onMatchStart }: LobbyProps) {
    const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
    const [joinCode, setJoinCode] = useState("");
    const [createdCode, setCreatedCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreateMatch = async () => {
        try {
            setIsLoading(true);
            setError("");
            const response = await matchesAPI.createMatch();
            setCreatedCode(response.data.joinCode);
            setMode("create");

            // Start polling or waiting for socket event (handled by parent usually, 
            // but here we just show the code. The parent page should be listening for 'player_joined' 
            // if we pass the matchId up, or we wait here?)
            // Better: Pass matchId up immediately so parent can connect socket.
            onMatchStart(response.data);

        } catch (err) {
            console.error(err);
            setError("Failed to create match");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinMatch = async () => {
        if (joinCode.length !== 6) {
            setError("Code must be 6 digits");
            return;
        }

        try {
            setIsLoading(true);
            setError("");
            const response = await matchesAPI.joinMatch(joinCode);
            onMatchStart(response.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to join match");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10" />

            <div className="relative z-10">
                <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                    Ready to Compete?
                </h2>

                <AnimatePresence mode="wait">
                    {mode === "menu" && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <button
                                onClick={handleCreateMatch}
                                disabled={isLoading}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Create Match
                            </button>

                            <button
                                onClick={() => setMode("join")}
                                className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-all flex items-center justify-center gap-3"
                            >
                                <Users className="w-5 h-5" />
                                Join Match
                            </button>
                        </motion.div>
                    )}

                    {mode === "join" && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-medium">Enter Match Code</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-purple-500 transition-colors placeholder-white/10"
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">{error}</p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setMode("menu")}
                                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleJoinMatch}
                                    disabled={isLoading || joinCode.length !== 6}
                                    className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold transition-colors shadow-lg shadow-blue-500/25"
                                >
                                    {isLoading ? "Joining..." : "Join Match"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {mode === "create" && (
                        // This state might be transient if we immediately pass data up.
                        // But if we want to show the code HERE while waiting, we need to handle that.
                        // The parent will receive the match data (with code) and can decide to show a "Waiting" screen.
                        // So actually, this component's job is done once match is created.
                        // I'll leave this empty or a loading state just in case.
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8"
                        >
                            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-gray-400">Setting up match...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
