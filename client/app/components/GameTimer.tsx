import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface GameTimerProps {
    duration: number;
    onComplete: () => void;
    isActive: boolean;
}

export default function GameTimer({ duration, onComplete, isActive }: GameTimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (!isActive) return;

        setTimeLeft(duration);
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [duration, isActive, onComplete]);

    const progress = (timeLeft / duration) * 100;
    const isUrgent = timeLeft <= 3;

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-gray-400 font-medium">Time Remaining</span>
                <span className={`text-2xl font-bold ${isUrgent ? "text-red-500 animate-pulse" : "text-white"}`}>
                    {timeLeft}s
                </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full ${isUrgent ? "bg-red-500" : "bg-purple-500"}`}
                    initial={{ width: "100%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                />
            </div>
        </div>
    );
}
