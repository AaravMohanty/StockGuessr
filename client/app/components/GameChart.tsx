"use client";

import { useState, useMemo } from "react";
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea,
    Cell,
    Customized,
} from "recharts";
import { motion } from "framer-motion";
import { CandlestickChart, LineChart as LineIcon } from "lucide-react";

interface Candle {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface GameChartProps {
    contextCandles: Candle[];
    gameCandles: Candle[];
    currentWeek: number; // 0-3
    gameState: "matchmaking" | "ready" | "playing" | "completed" | "error";
}

// Helper to aggregate daily candles into weekly
const aggregateToWeekly = (dailies: Candle[]): Candle[] => {
    const weeklies: Candle[] = [];
    let currentWeekCandles: Candle[] = [];

    dailies.forEach((candle, index) => {
        currentWeekCandles.push(candle);

        // Assuming 5 trading days per week or just grouping by 5 for simplicity if dates aren't perfect
        // Better: Check if next candle is Monday or current is Friday. 
        // For this game data, we know it's generated sequentially. Let's group by 5s.
        if (currentWeekCandles.length === 5 || index === dailies.length - 1) {
            const open = currentWeekCandles[0].open;
            const close = currentWeekCandles[currentWeekCandles.length - 1].close;
            const high = Math.max(...currentWeekCandles.map(c => c.high));
            const low = Math.min(...currentWeekCandles.map(c => c.low));
            const volume = currentWeekCandles.reduce((acc, c) => acc + c.volume, 0);
            const date = currentWeekCandles[currentWeekCandles.length - 1].date; // Use Friday's date

            weeklies.push({ date, open, high, low, close, volume });
            currentWeekCandles = [];
        }
    });

    return weeklies;
};

const CustomCandle = (props: any) => {
    const { x, y, width, height, low, high, open, close } = props;
    const isUp = close >= open;
    const color = isUp ? "#10B981" : "#F43F5E";
    const ratio = Math.abs(height / (open - close)); // px per dollar (approx)

    // Calculate y positions
    // Recharts Y axis is inverted (0 is top)
    // We need to map price to Y coordinate. 
    // props.y is the top of the bar (min(open, close)). props.height is abs(open-close).
    // But we need the wick positions.

    // Actually, Recharts passes formatted values. 
    // Let's use a simpler approach: Recharts Bar can't easily do wicks without custom data.
    // Standard trick: ErrorBar or composed shapes. 
    // BETTER: Draw SVG directly using the scales provided in props (yAxis, xAxis).

    // However, props.y and props.height correspond to the bar body (open/close).
    // We need to calculate high/low Y positions.
    // Since we don't have the scale easily here without context, we might struggle.

    // Alternative: Use a composed chart with:
    // 1. Bar for Body (Open-Close)
    // 2. ErrorBar for Wicks? No, ErrorBar is limited.
    // 3. Custom Shape is best, but we need the scale.

    // Let's try a simplified approach for the custom shape where we assume we receive the scaled values if we pass them as data.
    // But standard Bar only passes the value it represents.

    // Let's stick to a simpler visual for now: 
    // Use a Bar chart where the bar is the body.
    // And a Line chart for the wicks? No.

    // Let's use the "Error Bar" trick or just draw lines if we can get the scale.
    // Actually, Recharts `Customized` component or `shape` prop on Bar receives `y` (top) and `height`.
    // It doesn't receive the high/low pixels.

    // WAIT: We can pass [min, max] to Bar to draw the range? No.

    // Let's use a standard trick: 
    // The Bar represents the Body. 
    // We add a separate "Line" or "Scatter" for High/Low?

    // Actually, for this task, let's use a robust library or just standard Recharts tricks.
    // Common trick: 
    // Data: { min: low, max: high, ... }
    // We can use a Bar for the range (High-Low) with a very thin width (Wick).
    // And another Bar on top for the Body (Open-Close) with full width.
    // This requires two data series.

    return (
        <g stroke={color} fill={color} strokeWidth="2">
            {/* Wick */}
            <line x1={x + width / 2} y1={props.yHigh} x2={x + width / 2} y2={props.yLow} />
            {/* Body */}
            <rect
                x={x}
                y={props.yBody}
                width={width}
                height={Math.max(2, props.hBody)} // Min height 2px so dojis are visible
                fill={color}
                stroke="none"
            />
        </g>
    );
};

export default function GameChart({ contextCandles, gameCandles, currentWeek, gameState }: GameChartProps) {
    const [chartType, setChartType] = useState<"candle" | "line">("candle");

    console.log("GameChart Render:", {
        contextLen: contextCandles?.length,
        gameLen: gameCandles?.length,
        currentWeek,
        gameState
    });

    const data = useMemo(() => {
        if (!contextCandles || !gameCandles) {
            console.log("Missing candles data");
            return [];
        }

        // 1. Aggregate Context to Weekly
        const weeklyContext = aggregateToWeekly(contextCandles);
        console.log("Weekly Context:", weeklyContext.length);

        // 2. Prepare Game Data (Daily)
        // Only show up to current week's revealed days
        // But wait, gameCandles are 20 days (4 weeks * 5 days).
        // If currentWeek is 0, we show first 5 days? 
        // The prompt says "Weekly Rounds". 
        // Usually in this game, we reveal one week at a time.
        // So if currentWeek = 0 (Week 1), we show days 0-4.

        const revealedGameDays = gameState === "completed"
            ? gameCandles
            : gameCandles.slice(0, (currentWeek + 1) * 5);

        // 3. Combine
        // We need a continuous X axis. 
        // We'll just map them to a sequence.

        const combined = [
            ...weeklyContext.map(c => ({ ...c, type: "context", period: "Weekly" })),
            ...revealedGameDays.map(c => ({ ...c, type: "game", period: "Daily" }))
        ];

        return combined.map((c, i) => ({
            ...c,
            index: i,
            // For Candle Shape
            // We need to pre-calculate these for the custom shape if we want to be precise, 
            // but Recharts scales are internal.
            // Instead, let's just pass the raw values and handle formatting.

            // For coloring
            color: c.close >= c.open ? "#10B981" : "#F43F5E",
        }));
    }, [contextCandles, gameCandles, currentWeek, gameState]);

    // Custom Layer for Candlesticks using Customized component
    // This ensures we have access to xAxis and yAxis scales
    const CandleStickLayer = (props: any) => {
        const { data, xAxisMap, yAxisMap } = props;
        const xAxis = xAxisMap?.[0];
        const yAxis = yAxisMap?.price || yAxisMap?.[0];

        if (!data || !xAxis || !yAxis) return null;

        return (
            <g>
                {data.map((entry: any, index: number) => {
                    const x = xAxis.scale(entry.date);
                    // Calculate bandwidth safely
                    let bandwidth = 20;
                    if (xAxis.scale.bandwidth) {
                        bandwidth = xAxis.scale.bandwidth();
                    }

                    // Adjust width
                    const width = Math.max(4, bandwidth * 0.6);
                    const xOffset = (bandwidth - width) / 2;

                    const yOpen = yAxis.scale(entry.open);
                    const yClose = yAxis.scale(entry.close);
                    const yHigh = yAxis.scale(entry.high);
                    const yLow = yAxis.scale(entry.low);

                    const yBody = Math.min(yOpen, yClose);
                    const hBody = Math.abs(yOpen - yClose);

                    return (
                        <CustomCandle
                            key={index}
                            x={x + xOffset}
                            yHigh={yHigh}
                            yLow={yLow}
                            yBody={yBody}
                            hBody={hBody}
                            width={width}
                            open={entry.open}
                            close={entry.close}
                        />
                    );
                })}
            </g>
        );
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Controls */}
            <div className="flex justify-end mb-2 gap-2">
                <div className="bg-white/5 rounded-lg p-1 flex gap-1">
                    <button
                        onClick={() => setChartType("candle")}
                        className={`p-2 rounded ${chartType === "candle" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
                        title="Candlestick View"
                    >
                        <CandlestickChart size={20} />
                    </button>
                    <button
                        onClick={() => setChartType("line")}
                        className={`p-2 rounded ${chartType === "line" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
                        title="Line View"
                    >
                        <LineIcon size={20} />
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 10 }}
                            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            minTickGap={30}
                        />
                        <YAxis
                            yAxisId="price"
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 10 }}
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => `$${val}`}
                            width={60}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            formatter={(val: number, name: string) => [
                                `$${val.toFixed(2)}`,
                                name.charAt(0).toUpperCase() + name.slice(1)
                            ]}
                        />

                        {/* Background Areas for Phases */}
                        {data.length > 0 && (
                            <ReferenceArea
                                yAxisId="price"
                                x1={data[0].date}
                                x2={data[data.findIndex(d => d.type === "game") - 1]?.date || data[data.length - 1].date}
                                fill="rgba(255, 255, 255, 0.03)"
                                strokeOpacity={0}
                            />
                        )}
                        {data.length > 0 && (
                            <ReferenceArea
                                yAxisId="price"
                                x1={data[data.findIndex(d => d.type === "game") - 1]?.date}
                                x2={data[data.findIndex(d => d.type === "game") - 1]?.date}
                                stroke="rgba(255, 255, 255, 0.1)"
                                strokeDasharray="3 3"
                            />
                        )}

                        {chartType === "line" ? (
                            <Line
                                yAxisId="price"
                                type="monotone"
                                dataKey="close"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, fill: '#fff' }}
                            />
                        ) : (
                            <Customized component={CandleStickLayer} data={data} />
                        )}

                        {/* Volume - Commented out as per user request */}
                        {/* <Bar dataKey="volume" fill="rgba(255,255,255,0.1)" yAxisId={0} barSize={4} /> */}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
