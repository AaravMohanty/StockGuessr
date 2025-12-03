"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Zap, TrendingUp, Users, Crown, Sparkles, Lock, Rocket } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Premium Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Cyan glow - top right */}
        <motion.div
          className="absolute -top-96 -right-96 w-[900px] h-[900px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0, 230, 197, 0.18) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
          animate={{
            x: [0, 60, 0],
            y: [0, 40, 0],
            scale: [1, 1.12, 1],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Magenta glow - bottom left */}
        <motion.div
          className="absolute -bottom-96 -left-96 w-[900px] h-[900px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(216, 92, 224, 0.14) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
          animate={{
            x: [0, -50, 0],
            y: [0, -60, 0],
            scale: [1, 1.18, 1],
          }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Blue accent - center */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
            filter: "blur(120px)",
          }}
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,230,197,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,230,197,0.015)_1px,transparent_1px)] bg-[size:100px_100px] opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          className="fixed top-0 w-full z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-b from-[#0a0a0a]/80 to-[#0a0a0a]/40 border-b border-white/5" />
          <div className="relative max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
            <motion.div
              className="text-xl font-black tracking-tight"
              style={{
                background: "linear-gradient(135deg, #00e6c5 0%, #d85ce0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              whileHover={{ scale: 1.05 }}
            >
              STOCK GUESSR
            </motion.div>
            <motion.div
              className="flex gap-3 items-center"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <Link href="/login">
                <motion.button
                  className="px-6 py-2.5 text-sm font-medium text-white/60 hover:text-white/90 transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button
                  className="px-7 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section className="min-h-screen w-full pt-32 px-8 flex flex-col justify-center items-center">
          <motion.div
            className="max-w-5xl w-full text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-cyan-500/30 bg-cyan-500/5 mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-200">Next-Gen Trading Competition</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tight"
            >
              <span className="block text-white">Trade Against</span>
              <span className="block" style={{
                background: "linear-gradient(135deg, #00e6c5 0%, #d85ce0 50%, #00e6c5 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Your Rivals
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-gray-300/80 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Compete in 1v1 trading duels. Predict stock movements in real-time, outperform your opponents, and climb the global leaderboard.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex gap-4 justify-center flex-wrap mb-16"
            >
              <Link href="/register">
                <motion.button
                  className="px-10 py-4 rounded-lg text-lg font-bold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 transition-all duration-300 shadow-2xl shadow-cyan-500/30 flex items-center gap-3 group"
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Trading Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <motion.button
                className="px-10 py-4 rounded-lg text-lg font-bold text-white border-2 border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                { value: "50K+", label: "Active Traders" },
                { value: "10K+", label: "Daily Matches" },
                { value: "$2M", label: "Prize Pool" },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="p-4 md:p-6 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-md hover:border-cyan-500/30 transition-all duration-300"
                >
                  <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400 mt-2">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="text-center mb-20"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-200px" }}
            >
              <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                <span className="text-white">Why Elite Traders</span>
                <br />
                <span style={{
                  background: "linear-gradient(135deg, #00e6c5 0%, #d85ce0 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Choose StockGuessr
                </span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto mt-6">
                Everything you need to dominate the competition
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: TrendingUp,
                  title: "Real Market Data",
                  description: "Live stock data with historical context for authentic trading decisions",
                  gradient: "from-emerald-500/20 to-emerald-500/5",
                  accent: "emerald",
                },
                {
                  icon: Zap,
                  title: "Lightning Matches",
                  description: "5-minute intense trading duels that test your skill and strategy",
                  gradient: "from-yellow-500/20 to-yellow-500/5",
                  accent: "yellow",
                },
                {
                  icon: Users,
                  title: "Global Leaderboard",
                  description: "Compete against traders worldwide and earn exclusive rankings",
                  gradient: "from-blue-500/20 to-blue-500/5",
                  accent: "blue",
                },
                {
                  icon: Crown,
                  title: "Ranked Rewards",
                  description: "Climb divisions and unlock premium badges, skins, and cash prizes",
                  gradient: "from-purple-500/20 to-purple-500/5",
                  accent: "purple",
                },
                {
                  icon: Sparkles,
                  title: "AI Analysis",
                  description: "Get detailed post-game insights powered by advanced machine learning",
                  gradient: "from-pink-500/20 to-pink-500/5",
                  accent: "pink",
                },
                {
                  icon: Lock,
                  title: "Secure Trading",
                  description: "Enterprise-grade security with encrypted transactions and data protection",
                  gradient: "from-cyan-500/20 to-cyan-500/5",
                  accent: "cyan",
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  className={`p-8 rounded-2xl border border-white/5 bg-gradient-to-br ${feature.gradient} backdrop-blur-md hover:border-white/15 transition-all duration-500 group`}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.08 }}
                  viewport={{ once: true, margin: "-150px" }}
                  whileHover={{ y: -8, borderColor: "rgba(255,255,255,0.2)" }}
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${feature.accent}-500/30 to-${feature.accent}-600/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 text-${feature.accent}-400`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-32 px-8 relative">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-5xl md:text-6xl font-black text-center mb-20"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-200px" }}
            >
              <span className="text-white">Get Started in</span>
              <br />
              <span style={{
                background: "linear-gradient(135deg, #00e6c5 0%, #d85ce0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                4 Simple Steps
              </span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { num: "1", title: "Create Account", desc: "Sign up in seconds with email or social login" },
                { num: "2", title: "Find a Match", desc: "Get paired with a trader of equal skill level" },
                { num: "3", title: "Make Your Trade", desc: "Analyze and predict stock movements in real-time" },
                { num: "4", title: "Earn Rewards", desc: "Win matches and climb the global leaderboard" },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  className="relative"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  viewport={{ once: true, margin: "-150px" }}
                >
                  <div className="p-8 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md h-full flex flex-col">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-black text-lg mb-6">
                      {step.num}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 text-sm">{step.desc}</p>
                  </div>
                  {idx < 3 && (
                    <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 items-center justify-center w-6 h-6">
                      <ArrowRight className="w-5 h-5 text-cyan-500/40" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-8">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-200px" }}
          >
            <div className="p-16 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 backdrop-blur-2xl">
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                Ready to Dominate?
              </h2>
              <p className="text-gray-300 text-xl mb-10 max-w-2xl mx-auto">
                Join thousands of traders competing for glory, prizes, and bragging rights. Your trading journey starts now.
              </p>
              <motion.div className="flex gap-4 justify-center flex-wrap">
                <Link href="/register">
                  <motion.button
                    className="px-12 py-5 rounded-lg text-lg font-bold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 transition-all duration-300 shadow-2xl shadow-cyan-500/40 flex items-center gap-3"
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Rocket className="w-5 h-5" />
                    Launch Your Career
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-8 border-t border-white/5 bg-gradient-to-t from-[#0a0a0a] to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div style={{
                background: "linear-gradient(135deg, #00e6c5 0%, #d85ce0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }} className="text-lg font-black">
                STOCK GUESSR
              </div>
              <div className="text-sm text-gray-400">
                © 2024 StockGuessr. All rights reserved. | Built for traders, by traders.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
