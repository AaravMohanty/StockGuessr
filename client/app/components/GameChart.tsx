"use client";

import { useEffect, useRef, useMemo } from "react";
import { createChart, CandlestickSeries, HistogramSeries, IChartApi, createSeriesMarkers } from "lightweight-charts";

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

        if (currentWeekCandles.length === 5 || index === dailies.length - 1) {
            const open = currentWeekCandles[0].open;
            const close = currentWeekCandles[currentWeekCandles.length - 1].close;
            const high = Math.max(...currentWeekCandles.map(c => c.high));
            const low = Math.min(...currentWeekCandles.map(c => c.low));
            const volume = currentWeekCandles.reduce((acc, c) => acc + c.volume, 0);
            const date = currentWeekCandles[currentWeekCandles.length - 1].date;

            weeklies.push({ date, open, high, low, close, volume });
            currentWeekCandles = [];
        }
    });

    return weeklies;
};

export default function GameChart({ contextCandles, gameCandles, currentWeek, gameState }: GameChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<any>(null);
    const volumeSeriesRef = useRef<any>(null);
    const markersPluginRef = useRef<any>(null);

    // Prepare combined data
    const { candleData, volumeData, weekBoundaries } = useMemo(() => {
        if (!contextCandles || !gameCandles) {
            return { candleData: [], volumeData: [], weekBoundaries: [] };
        }

        // Aggregate context to weekly
        const weeklyContext = aggregateToWeekly(contextCandles);

        // Get revealed game days
        const revealedGameDays = gameState === "completed"
            ? gameCandles
            : gameCandles.slice(0, (currentWeek + 1) * 5);

        // Combine
        const combined = [...weeklyContext, ...revealedGameDays];

        // Convert to lightweight-charts format
        // lightweight-charts requires date in 'yyyy-mm-dd' format
        const candleData = combined.map(c => ({
            time: c.date.split('T')[0], // Extract yyyy-mm-dd from ISO string
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
        }));

        const volumeData = combined.map(c => ({
            time: c.date.split('T')[0], // Extract yyyy-mm-dd from ISO string
            value: c.volume,
            color: c.close >= c.open ? "rgba(38, 166, 154, 0.3)" : "rgba(239, 83, 80, 0.3)",
        }));

        // Calculate week boundaries for game candles (every 5 days = 1 week)
        // We want lines at the START of each new week (day 0, 5, 10, 15)
        const weekBoundaries: string[] = [];
        const contextEndIndex = weeklyContext.length;

        // Add boundary between context and game (if game has started)
        if (revealedGameDays.length > 0) {
            weekBoundaries.push(revealedGameDays[0].date.split('T')[0]);
        }

        // Add boundaries at start of each new week (days 5, 10, 15)
        for (let week = 1; week <= 3; week++) {
            const dayIndex = week * 5;
            if (dayIndex < revealedGameDays.length) {
                weekBoundaries.push(revealedGameDays[dayIndex].date.split('T')[0]);
            }
        }

        return { candleData, volumeData, weekBoundaries };
    }, [contextCandles, gameCandles, currentWeek, gameState]);

    // Create chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Create chart instance
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: "transparent" },
                textColor: "#666",
            },
            grid: {
                vertLines: { color: "rgba(255, 255, 255, 0.03)" },
                horzLines: { color: "rgba(255, 255, 255, 0.03)" },
            },
            crosshair: {
                mode: 1, // Normal crosshair
                vertLine: {
                    color: "rgba(255, 255, 255, 0.3)",
                    width: 1,
                    style: 2, // Dashed
                    labelBackgroundColor: "#333",
                },
                horzLine: {
                    color: "rgba(255, 255, 255, 0.3)",
                    width: 1,
                    style: 2,
                    labelBackgroundColor: "#333",
                },
            },
            timeScale: {
                borderColor: "#333",
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: "#333",
            },
        });

        // Candlestick series - v5 unified API
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#26a69a",
            downColor: "#ef5350",
            borderUpColor: "#26a69a",
            borderDownColor: "#ef5350",
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
        });

        // Volume series - v5 unified API
        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: "volume" },
            priceScaleId: "", // Overlay on main chart
        });

        // Set volume scale to bottom 20%
        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                });
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
            volumeSeriesRef.current = null;
        };
    }, []);

    // Update data when it changes
    useEffect(() => {
        if (!chartRef.current || !candleSeriesRef.current || !volumeSeriesRef.current) return;

        if (candleData.length > 0) {
            candleSeriesRef.current.setData(candleData);
        }

        if (volumeData.length > 0) {
            volumeSeriesRef.current.setData(volumeData);
        }

        // Add week boundary markers using the plugin API
        if (weekBoundaries.length > 0 && candleSeriesRef.current) {
            const markers = weekBoundaries.map((time, index) => ({
                time,
                position: 'aboveBar' as const,
                color: '#9333ea', // Purple color
                shape: 'arrowDown' as const,
                text: index === 0 ? 'G' : `W${index + 1}`, // G for Game start, W2, W3, W4
            }));

            // Create or update the markers plugin
            if (!markersPluginRef.current) {
                markersPluginRef.current = createSeriesMarkers(candleSeriesRef.current, markers);
            } else {
                markersPluginRef.current.setMarkers(markers);
            }
        }

        // Fit content
        chartRef.current.timeScale().fitContent();
    }, [candleData, volumeData, weekBoundaries]);

    return (
        <div className="w-full h-full flex flex-col">
            <div ref={chartContainerRef} className="flex-1 min-h-0" />
        </div>
    );
}
