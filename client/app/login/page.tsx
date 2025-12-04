"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refetchUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Attempting login with:", email);
      const response = await authAPI.login(email, password);
      console.log("Login response:", response);

      if (response.data && response.data.token) {
        console.log("Token received, saving and redirecting...");
        localStorage.setItem("token", response.data.token);

        // Update auth context
        await refetchUser();

        router.push("/dashboard");
      } else {
        console.error("Login successful but no token in response:", response.data);
        setError("Login failed: No token received");
      }
    } catch (error: any) {
      console.error("Login error object:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        if (error.response.data?.message) {
          setError(`Server Error: ${error.response.data.message}`);
        } else {
          setError(`Login failed with status: ${error.response.status}`);
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        setError("Network Error: No response from server. Check if backend is running.");
      } else {
        console.error("Error setting up request:", error.message);
        setError(`Application Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
          <Link href="/">
            <motion.div
              className="text-2xl font-bold text-gradient"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              StockGuessr
            </motion.div>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {/* Background gradient orbs */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 100, 0],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -100, 0],
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <motion.div
          className="w-full max-w-md z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="glassmorphism p-8 rounded-2xl border border-white/20">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-400 mb-8">Sign in to continue trading</p>

            {error && (
              <motion.div
                className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-200 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-gradient-primary text-white font-bold hover:shadow-lg glow-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-gray-400 mt-6">
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-purple-400 hover:text-purple-300 transition font-semibold cursor-pointer">
                  Sign up
                </span>
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
