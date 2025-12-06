"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, TrendingUp, BarChart3, LineChart, DollarSign, Shield, Award, Clock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// Logo component
function StockGuessrLogo() {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
      >
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
      </motion.div>
      <div className="flex flex-col">
        <span className="font-bold text-base tracking-tight text-white leading-none">
          StockGuessr
        </span>
        <span className="text-[10px] text-emerald-500 font-medium tracking-wide">
          COMPETITIVE TRADING
        </span>
      </div>
    </div>
  );
}

// Live ticker component
function LiveTicker() {
  const stocks = [
    { symbol: "AAPL", price: 178.23, change: 2.34, positive: true },
    { symbol: "TSLA", price: 242.15, change: -1.23, positive: false },
    { symbol: "GOOGL", price: 141.87, change: 3.45, positive: true },
    { symbol: "AMZN", price: 176.92, change: 1.89, positive: true },
    { symbol: "MSFT", price: 425.44, change: -0.56, positive: false },
    { symbol: "NVDA", price: 495.22, change: 4.21, positive: true },
    { symbol: "META", price: 512.33, change: 2.15, positive: true },
    { symbol: "JPM", price: 234.76, change: -0.87, positive: false },
  ];

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-slate-900/50 via-slate-800/30 to-slate-900/50 border-y border-slate-700/30 backdrop-blur-sm py-3">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: [0, -1500] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {[...stocks, ...stocks, ...stocks].map((stock, idx) => (
          <div key={idx} className="flex items-center gap-3 text-sm">
            <span className="text-slate-300 font-semibold tracking-wide">{stock.symbol}</span>
            <span className="text-slate-400 font-medium">${stock.price}</span>
            <span className={`font-bold flex items-center gap-1 ${stock.positive ? "text-emerald-400" : "text-red-400"}`}>
              {stock.positive ? "▲" : "▼"}
              {stock.positive ? "+" : ""}{stock.change}%
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Market grid background
function MarketGrid() {
  return (
    <>
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />

      {/* Financial chart lines effect */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="chart-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M0 100 L50 80 L100 90 L150 60 L200 70" stroke="rgba(16,185,129,0.3)" strokeWidth="2" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chart-pattern)" />
      </svg>
    </>
  );
}

// Magnetic button component
function MagneticButton({ children, className, href }: { children: React.ReactNode; className: string; href?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const button = (
    <motion.button
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );

  return href ? <Link href={href}>{button}</Link> : button;
}

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(1247);
  const [prediction, setPrediction] = useState<"up" | "down" | null>(null);

  // Simulate live user count
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Professional Financial Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <MarketGrid />

        {/* Subtle emerald glow - top right */}
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Subtle blue accent - bottom left */}
        <motion.div
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Live Ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <LiveTicker />
        </motion.div>

        {/* Navigation */}
        <motion.nav
          className="sticky top-0 w-full z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="absolute inset-0 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50" />
          <div className="relative max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
            <StockGuessrLogo />

            {/* Online users badge */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-bold text-emerald-300 tracking-wide">
                {onlineUsers.toLocaleString()} LIVE TRADERS
              </span>
            </motion.div>

            <motion.div
              className="flex gap-4 items-center"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <Link href="/login">
                <motion.button
                  className="px-6 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Sign In
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button
                  className="px-8 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Trading
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.nav>

        {/* Hero Section - Finance Professional */}
        <section className="min-h-screen w-full pt-32 px-8 flex flex-col justify-center items-center">
          <motion.div
            className="max-w-5xl w-full text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Market status badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-slate-300 tracking-wide">MARKETS OPEN • LIVE TRADING</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-[1.1] tracking-tight"
            >
              <span className="text-white block">Master the Market.</span>
              <span className="block bg-gradient-to-r from-emerald-400 via-emerald-500 to-blue-500 bg-clip-text text-transparent">
                Outperform the Competition.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              Head-to-head stock prediction battles. Real market data.
              <span className="text-emerald-400"> Real rewards.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex gap-4 justify-center items-center mb-16">
              <Link href="/register">
                <motion.button
                  className="px-10 py-4 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-xl shadow-emerald-500/30 flex items-center gap-3"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <DollarSign className="w-5 h-5" />
                  Start Trading Free
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <motion.button
                className="px-10 py-4 rounded-xl text-lg font-bold text-slate-300 border-2 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <LineChart className="w-5 h-5" />
                View Demo
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-8 max-w-3xl mx-auto"
              variants={containerVariants}
            >
              {[
                { value: "$2.5M+", label: "Total Winnings", icon: DollarSign },
                { value: "50K+", label: "Active Traders", icon: TrendingUp },
                { value: "500K+", label: "Matches Played", icon: BarChart3 },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm hover:border-emerald-500/30 hover:bg-slate-800/50 transition-all group"
                >
                  <stat.icon className="w-6 h-6 text-emerald-500 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                  <div className="text-3xl font-black text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Interactive Game Preview */}
        <section className="py-24 px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Experience Live Trading
              </h2>
              <p className="text-slate-400 text-lg">Make your market call</p>
            </motion.div>

            <motion.div
              className="relative p-10 rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              {/* Glow effect when prediction is made */}
              {prediction && (
                <motion.div
                  className="absolute inset-0 -z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 1.5 }}
                >
                  <div className={`absolute inset-0 ${prediction === 'up' ? 'bg-emerald-500/20' : 'bg-red-500/20'} blur-3xl`} />
                </motion.div>
              )}

              {/* Chart */}
              <div className="mb-8 p-8 rounded-2xl bg-slate-950/50 border border-slate-800/50 backdrop-blur-sm">
                <div className="flex items-end justify-between h-56 gap-2 mb-6">
                  {[40, 45, 38, 52, 48, 65, 58, 72, 68, 82, 75, 88].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t relative group cursor-pointer"
                      style={{
                        height: `${h}%`,
                        background: prediction === 'up'
                          ? 'linear-gradient(to top, rgba(16, 185, 129, 0.8), rgba(16, 185, 129, 1))'
                          : prediction === 'down'
                          ? 'linear-gradient(to top, rgba(239, 68, 68, 0.8), rgba(239, 68, 68, 1))'
                          : 'linear-gradient(to top, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.9))'
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                      whileHover={{ opacity: 1, scale: 1.05 }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 px-2 py-1 rounded text-xs font-bold text-emerald-400 border border-slate-700/50">
                        ${(180 + h).toFixed(2)}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-white font-bold text-lg">NVDA</span>
                    <span className="text-slate-500 text-sm ml-3 font-medium">NVIDIA Corporation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold text-lg">+2.8%</span>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-emerald-400 font-bold text-xs tracking-wide">LIVE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Buttons */}
              <div className="grid grid-cols-2 gap-5">
                <motion.button
                  className="relative py-7 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-black text-xl overflow-hidden group shadow-xl shadow-emerald-500/20"
                  onClick={() => setPrediction('up')}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative flex items-center justify-center gap-3">
                    <TrendingUp className="w-7 h-7" strokeWidth={3} />
                    LONG
                  </span>
                  {prediction === 'up' && (
                    <motion.div
                      className="absolute inset-0 border-4 border-white/60 rounded-2xl"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    />
                  )}
                </motion.button>

                <motion.button
                  className="relative py-7 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white font-black text-xl overflow-hidden group shadow-xl shadow-red-500/20"
                  onClick={() => setPrediction('down')}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative flex items-center justify-center gap-3">
                    <TrendingUp className="w-7 h-7 rotate-180" strokeWidth={3} />
                    SHORT
                  </span>
                  {prediction === 'down' && (
                    <motion.div
                      className="absolute inset-0 border-4 border-white/60 rounded-2xl"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    />
                  )}
                </motion.button>
              </div>

              {prediction && (
                <motion.div
                  className="text-center mt-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-emerald-300 font-semibold text-lg">
                    Position locked! Ready to trade for real?
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Features Section - Professional */}
        <section className="py-24 px-8 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Why Top Traders Choose Us
              </h2>
              <p className="text-slate-400 text-lg">The competitive edge you need</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Clock, title: "Rapid Execution", desc: "5-minute competitive rounds with instant settlement", color: "emerald" },
                { icon: Award, title: "Performance Based", desc: "Rankings and rewards tied to trading accuracy", color: "blue" },
                { icon: Shield, title: "Market Integrity", desc: "Real-time data from trusted financial sources", color: "purple" },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="group relative p-8 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm cursor-pointer overflow-hidden"
                  onMouseEnter={() => setHoveredFeature(idx)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6, borderColor: 'rgba(16, 185, 129, 0.3)' }}
                >
                  {/* Gradient glow on hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      item.color === 'emerald' ? 'from-emerald-500/10 to-emerald-600/5' :
                      item.color === 'blue' ? 'from-blue-500/10 to-blue-600/5' :
                      'from-purple-500/10 to-purple-600/5'
                    } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  <div className="relative">
                    <motion.div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${
                        item.color === 'emerald' ? 'from-emerald-500 to-emerald-600' :
                        item.color === 'blue' ? 'from-blue-500 to-blue-600' :
                        'from-purple-500 to-purple-600'
                      } flex items-center justify-center mb-6 shadow-lg ${
                        item.color === 'emerald' ? 'shadow-emerald-500/20' :
                        item.color === 'blue' ? 'shadow-blue-500/20' :
                        'shadow-purple-500/20'
                      }`}
                      animate={hoveredFeature === idx ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <item.icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA - Professional */}
        <section className="py-32 px-8">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div className="relative p-12 rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 opacity-50" />

              <div className="relative text-center">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300 tracking-wide">JOIN THE COMPETITION</span>
                </motion.div>

                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                  Start Your Trading Journey
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-blue-500 bg-clip-text text-transparent">
                    Risk-Free
                  </span>
                </h2>

                <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto">
                  No deposits required. Test your market predictions against {onlineUsers.toLocaleString()} active traders.
                </p>

                <Link href="/register">
                  <motion.button
                    className="px-12 py-5 rounded-xl text-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-2xl shadow-emerald-500/40 inline-flex items-center gap-3"
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <DollarSign className="w-6 h-6" />
                    Create Free Account
                    <ArrowRight className="w-6 h-6" />
                  </motion.button>
                </Link>

                <p className="text-slate-500 text-sm mt-6">
                  Full access • No credit card required • Start in 30 seconds
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer - Professional */}
        <footer className="py-10 px-8 border-t border-slate-800/50 bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
              <StockGuessrLogo />
              <div className="flex gap-6 text-sm text-slate-400">
                <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
                <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
                <a href="#" className="hover:text-emerald-400 transition-colors">Contact</a>
              </div>
            </div>
            <div className="text-center text-sm text-slate-500 border-t border-slate-800/50 pt-6">
              © 2025 StockGuessr. Market data for educational and competitive purposes only. Not financial advice.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
