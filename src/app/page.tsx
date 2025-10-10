"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";
import { TrendingUp, Brain, BarChart3 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Trading Dashboard</h1>
          <p className="text-gray-300">Monitor your AI trading agent&apos;s performance</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Live P&L</p>
          </div>
          <div className="text-center">
            <BarChart3 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Analytics</p>
          </div>
          <div className="text-center">
            <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">AI Insights</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-white/10 border border-white/20 text-white placeholder-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-white/10 border border-white/20 text-white placeholder-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg font-medium disabled:opacity-50 hover:from-blue-700 hover:to-purple-700 transition-all"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Access Dashboard"}
            </button>
            {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">Powered by Alpaca Paper Trading API</p>
        </div>
      </div>
    </div>
  );
}
