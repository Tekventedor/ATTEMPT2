"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// API functions for Alpaca data
async function fetchAlpacaData(endpoint: string) {
  try {
    const response = await fetch(`/api/alpaca?endpoint=${endpoint}`);
    if (!response.ok) throw new Error('Failed to fetch data');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Activity, 
  LogOut,
  RefreshCw,
  Brain,
  Target,
  AlertCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

interface TradingLog {
  id: string;
  title: string;
  description: string | null;
  action: string | null;
  symbol: string | null;
  quantity: number | null;
  price: number | null;
  total_value: number | null;
  reason: string | null;
  confidence_score: number | null;
  market_data: Record<string, unknown>;
  tags: string[];
  timestamp: string;
}

interface Position {
  id: string;
  title: string;
  description: string | null;
  symbol: string | null;
  quantity: number | null;
  average_price: number | null;
  current_price: number | null;
  total_value: number | null;
  unrealized_pnl: number | null;
  realized_pnl: number | null;
  tags: string[];
}

interface Account {
  portfolio_value: number;
  cash: number;
  buying_power: number;
  equity: number;
  account_number?: string;
  status?: string;
}

export default function TradingDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradingLogs, setTradingLogs] = useState<TradingLog[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<Array<{date: string, value: number, pnl: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Authentication disabled for public viewing
      // const { data } = await supabase.auth.getSession();
      // const session = data.session;
      // if (!session) {
      //   router.replace("/");
      //   return;
      // }
      // setEmail(session.user.email ?? null);

      // Load dashboard data directly from Alpaca
      await loadDashboardData();

      // Set up auto-refresh every 5 minutes (300000ms)
      const intervalId = setInterval(async () => {
        console.log('[AUTO-REFRESH] Refreshing Alpaca data...');
        await loadDashboardData();
      }, 300000); // 5 minutes

      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    };
    void init();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load account data directly from Alpaca
      const accountData = await fetchAlpacaData('account');
      if (accountData) {
        setAccount(accountData);
      }

      // Load positions directly from Alpaca
      const positionsData = await fetchAlpacaData('positions');
      if (positionsData && Array.isArray(positionsData)) {
        setPositions(positionsData.map((pos: Record<string, unknown>) => ({
          id: pos.asset_id as string,
          title: pos.symbol as string,
          description: `${pos.qty} shares at $${parseFloat(pos.current_price as string).toFixed(2)}`,
          symbol: pos.symbol as string,
          quantity: parseFloat(pos.qty as string),
          average_price: parseFloat(pos.avg_entry_price as string),
          current_price: parseFloat(pos.current_price as string),
          total_value: parseFloat(pos.market_value as string),
          unrealized_pnl: parseFloat(pos.unrealized_pl as string),
          realized_pnl: 0,
          tags: []
        })));
      }

      // Load orders directly from Alpaca
      const ordersData = await fetchAlpacaData('orders');
      if (ordersData && Array.isArray(ordersData)) {
        setTradingLogs(ordersData.slice(0, 50).map((order: Record<string, unknown>) => ({
          id: order.id as string,
          title: `${order.symbol as string} ${(order.side as string).toUpperCase()}`,
          description: `${order.type as string} order - ${order.status as string}`,
          action: (order.side as string).toUpperCase(),
          symbol: order.symbol as string,
          quantity: parseFloat(order.qty as string),
          price: order.filled_avg_price ? parseFloat(order.filled_avg_price as string) : null,
          total_value: order.filled_avg_price ? parseFloat(order.filled_avg_price as string) * parseFloat(order.qty as string) : null,
          reason: `${order.type as string} ${order.side as string}`,
          confidence_score: order.status === 'filled' ? 1.0 : 0.5,
          market_data: {},
          tags: [order.status as string],
          timestamp: order.submitted_at as string
        })));
      }

      // Load portfolio history directly from Alpaca
      const history = await fetchAlpacaData('portfolio-history');
      if (history && history.equity && Array.isArray(history.equity) && history.timestamp && Array.isArray(history.timestamp)) {
        // Filter out zero/negative equity and format hourly data
        const filteredHistory = history.equity
          .map((value: number, index: number) => ({
            timestamp: history.timestamp[index] * 1000, // Convert to milliseconds
            value: Math.abs(value), // Use absolute value to handle negative equity from Alpaca
          }))
          .filter((item: { timestamp: number; value: number }) => item.value > 1000); // Only show meaningful values

        // Group by hour and take only one data point per hour (preferably at :00)
        const hourlyData: Record<string, { timestamp: number; value: number }> = {};

        filteredHistory.forEach((item: { timestamp: number; value: number }) => {
          const date = new Date(item.timestamp);
          date.setMinutes(0);
          date.setSeconds(0);
          date.setMilliseconds(0);
          const hourKey = date.getTime().toString();

          // Keep the first item for each hour, or override if we find a :00 minute entry
          if (!hourlyData[hourKey] || new Date(item.timestamp).getMinutes() === 0) {
            hourlyData[hourKey] = item;
          }
        });

        const formattedHistory = Object.values(hourlyData)
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((item: { timestamp: number; value: number }, index: number, arr) => {
            const date = new Date(item.timestamp);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);

            return {
              date: format(date, 'MM/dd HH:mm'),
              value: item.value,
              pnl: index > 0 ? item.value - arr[index - 1].value : 0
            };
          });
        setPortfolioHistory(formattedHistory);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    // Auth removed - redirect to home
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading trading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0);

  // Calculate Market Exposure - how much capital is invested
  const investedAmount = (account?.portfolio_value || 0) - (account?.cash || 0);
  const marketExposure = account?.portfolio_value
    ? (investedAmount / account.portfolio_value) * 100
    : 0;

  // Define agent color palette with more unique colors
  const COLORS = ['#8b5cf6', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#a855f7'];

  // Assign colors dynamically to avoid repeats
  const AGENT_COLORS: Record<string, string> = {};
  positions.forEach((pos, index) => {
    if (pos.symbol && !AGENT_COLORS[pos.symbol]) {
      AGENT_COLORS[pos.symbol] = COLORS[index % COLORS.length];
    }
  });

  // Calculate agent performance history
  const agentPerformanceHistory = portfolioHistory.map((point, index) => {
    const result: Record<string, string | number> = { date: point.date, total: point.value };

    positions.forEach(pos => {
      if (pos.symbol) {
        // Simulate agent P&L evolution (in production, fetch real historical data)
        const baseValue = pos.total_value || 0;
        const variation = Math.sin(index * 0.3) * (baseValue * 0.05);
        result[pos.symbol] = baseValue + variation;
      }
    });

    return result;
  });

  // Calculate current P&L % for each agent
  const agentPnLPercent: Record<string, number> = {};
  positions.forEach(pos => {
    if (pos.symbol && pos.average_price && pos.current_price) {
      const pnlPercent = ((pos.current_price - pos.average_price) / pos.average_price) * 100;
      agentPnLPercent[pos.symbol] = pnlPercent;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg">
                <img src="/flowhunt-logo.svg" alt="Flowhunt Logo" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Flowhunt AI Trading Bot</h1>
              </div>
            </div>
            {/* Buttons hidden for public viewing */}
            {/* <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div> */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Total Balance */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Balance</p>
                <p className="text-2xl font-bold text-white">
                  ${account?.portfolio_value?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Cash + holdings</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>

          {/* Card 2: Current Profit/Loss */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Current Profit/Loss</p>
                <p className={`text-2xl font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalUnrealizedPnL >= 0 ? '+' : ''}{((totalUnrealizedPnL / (account?.portfolio_value || 1)) * 100).toFixed(2)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toLocaleString()} on open positions
                </p>
              </div>
              {totalUnrealizedPnL >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
            </div>
          </div>

          {/* Card 3: Market Exposure */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Market Exposure</p>
                <p className="text-2xl font-bold text-white">
                  {marketExposure.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {marketExposure.toFixed(0)}% invested, {(100 - marketExposure).toFixed(0)}% cash
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          {/* Card 4: Available to Invest */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Available to Invest</p>
                <p className="text-2xl font-bold text-white">
                  ${account?.cash?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Uninvested cash</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Main Performance Chart - 60/40 Split */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Stock Performance Chart - 60% width (3/5 columns) */}
          <div className="lg:col-span-3 bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Stock Performance (AI Trades)</h3>
              <div className="text-sm text-gray-300">
                Total: <span className={`font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalUnrealizedPnL >= 0 ? '+' : ''}{((totalUnrealizedPnL / (account?.portfolio_value || 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={agentPerformanceHistory.length > 0 ? agentPerformanceHistory : portfolioHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <YAxis
                  stroke="#9CA3AF"
                  domain={[3000, 15000]}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number, name: string) => {
                    const pnl = agentPnLPercent[name] || 0;
                    return [`$${value.toLocaleString()} (${pnl >= 0 ? '+' : ''}${pnl.toFixed(1)}%)`, `${name}`];
                  }}
                />
                {/* Individual Stock Lines */}
                {positions.map((pos, index) => pos.symbol && (
                  <Line
                    key={pos.symbol}
                    type="monotone"
                    dataKey={pos.symbol}
                    stroke={AGENT_COLORS[pos.symbol] || COLORS[index % COLORS.length]}
                    strokeWidth={3}
                    dot={false}
                    name={pos.symbol}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            {/* Agent P&L Callouts */}
            <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2">
              {positions.slice(0, 9).map((pos, index) => pos.symbol && (
                <div key={pos.symbol} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: AGENT_COLORS[pos.symbol] || COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-gray-200 font-medium">{pos.symbol}</span>
                  </div>
                  <span className={`font-bold ml-2 ${(agentPnLPercent[pos.symbol] || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(agentPnLPercent[pos.symbol] || 0) >= 0 ? '+' : ''}{(agentPnLPercent[pos.symbol] || 0).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log - 40% width (2/5 columns) */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Activity Log</h3>
            </div>

            {/* Activity Log */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {tradingLogs.slice(0, 20).map((log) => {
                return (
                  <div key={log.id} className="bg-white/5 rounded-lg p-2 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {log.action === 'BUY' ? (
                          <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />
                        ) : log.action === 'SELL' ? (
                          <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
                        ) : (
                          <Activity className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={`text-xs font-semibold ${
                          log.action === 'BUY' ? 'text-green-400' :
                          log.action === 'SELL' ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-xs text-white">{log.symbol}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">{log.quantity} @ ${log.price?.toFixed(2)}</span>
                        <span className="text-xs text-gray-300 font-medium">${log.total_value?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {tradingLogs.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No activity yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Decision Timeline */}
        <div className="hidden bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">AI Decision Timeline</h3>
            </div>
            <p className="text-xs text-gray-400">Showing AI thought process & actions</p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500"></div>

            {/* Timeline entries */}
            <div className="space-y-6">
              {tradingLogs.slice(0, 8).map((log, index) => {
                const companyName = log.symbol === 'AUST' ? 'Austin Gold Corp.' :
                                   log.symbol === 'CDE' ? 'Coeur Mining, Inc.' :
                                   log.symbol === 'LMND' ? 'Lemonade, Inc.' :
                                   log.symbol;

                return (
                  <div key={log.id} className="relative pl-16">
                    {/* Timeline dot */}
                    <div className={`absolute left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      log.action === 'BUY' ? 'bg-green-500 border-green-400' :
                      log.action === 'SELL' ? 'bg-red-500 border-red-400' :
                      'bg-gray-500 border-gray-400'
                    }`}>
                      {log.action === 'BUY' ? (
                        <TrendingUp className="w-3 h-3 text-white" />
                      ) : log.action === 'SELL' ? (
                        <TrendingDown className="w-3 h-3 text-white" />
                      ) : (
                        <Activity className="w-3 h-3 text-white" />
                      )}
                    </div>

                    {/* Content card */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              log.action === 'BUY' ? 'bg-green-500/20 text-green-400' :
                              log.action === 'SELL' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {log.action}
                            </span>
                            <span className="text-sm font-medium text-white">{companyName}</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {format(new Date(log.timestamp), 'MMMM dd, yyyy - HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">${log.total_value?.toLocaleString() || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{log.quantity} shares @ ${log.price?.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* AI Thought Process */}
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-start space-x-2">
                          <Brain className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-purple-300 mb-1">AI Reasoning:</p>
                            <p className="text-xs text-gray-300 leading-relaxed">
                              {log.reason || log.description || 'Market analysis indicated favorable conditions for this trade.'}
                            </p>
                          </div>
                        </div>

                        {/* Confidence indicator */}
                        {log.confidence_score && (
                          <div className="mt-3 flex items-center space-x-2">
                            <span className="text-xs text-gray-400">Confidence:</span>
                            <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${log.confidence_score * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-purple-400">{(log.confidence_score * 100).toFixed(0)}%</span>
                          </div>
                        )}

                        {/* Market context (simulated - will come from AI later) */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded">
                            {log.tags?.[0] || 'Market Order'}
                          </span>
                          {log.action === 'BUY' && (
                            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded">
                              Entry Position
                            </span>
                          )}
                          {log.action === 'SELL' && (
                            <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded">
                              Exit Position
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {tradingLogs.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No trading activity yet</p>
                  <p className="text-xs mt-1">AI decisions will appear here once trades are made</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Performance & Distribution Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Value History */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Portfolio Value</h3>
              {portfolioHistory.length > 0 && (() => {
                const values = portfolioHistory.map(h => h.value);
                const max = Math.max(...values);
                const min = Math.min(...values);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;

                return (
                  <div className="flex items-center space-x-3 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">Max:</span>
                      <span className="text-green-400 font-semibold">${max.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">Min:</span>
                      <span className="text-red-400 font-semibold">${min.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">Avg:</span>
                      <span className="text-blue-400 font-semibold">${avg.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={portfolioHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <YAxis
                  stroke="#9CA3AF"
                  domain={[90000, 110000]}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      // Find trades that occurred in this hour (rounded to match portfolio history)
                      const tradesAtTime = tradingLogs.filter(log => {
                        if (!log.timestamp) return false;
                        const tradeTime = new Date(log.timestamp);
                        tradeTime.setMinutes(0);
                        tradeTime.setSeconds(0);
                        tradeTime.setMilliseconds(0);
                        const tradeDate = format(tradeTime, 'MM/dd HH:mm');
                        return tradeDate === label;
                      });

                      return (
                        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
                          <p className="text-gray-300 text-sm mb-1 font-medium">{label}</p>
                          <p className="text-white font-semibold text-base mb-2">
                            Portfolio: ${payload[0].value.toLocaleString()}
                          </p>
                          {tradesAtTime.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-600">
                              <p className="text-xs text-gray-400 mb-2 font-semibold">
                                {tradesAtTime.length} Trade{tradesAtTime.length > 1 ? 's' : ''} in this hour:
                              </p>
                              {tradesAtTime.map((trade) => (
                                <div key={trade.id} className={`text-xs mb-1 ${trade.action === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                                  <span className="font-bold">{format(new Date(trade.timestamp), 'HH:mm')}</span> - <span className="font-bold">{trade.action}</span> {trade.symbol} - {trade.quantity} shares @ ${trade.price?.toFixed(2)}
                                  <span className="text-gray-400 ml-1">(${trade.total_value?.toLocaleString()})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Trade Annotations - Vertical lines for buy/sell events */}
                {tradingLogs.filter(log => log.timestamp).map((log) => {
                  // Round timestamp to nearest hour to match portfolio history
                  const tradeTime = new Date(log.timestamp);
                  tradeTime.setMinutes(0);
                  tradeTime.setSeconds(0);
                  tradeTime.setMilliseconds(0);
                  const tradeDate = format(tradeTime, 'MM/dd HH:mm');
                  const isBuy = log.action === 'BUY';

                  // Check if this timestamp exists in portfolio history
                  const existsInHistory = portfolioHistory.some(h => h.date === tradeDate);
                  if (!existsInHistory) return null;

                  return (
                    <ReferenceLine
                      key={log.id}
                      x={tradeDate}
                      stroke={isBuy ? '#10b981' : '#ef4444'}
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      label={{
                        value: isBuy ? '▲' : '▼',
                        position: 'top',
                        fill: isBuy ? '#10b981' : '#ef4444',
                        fontSize: 14,
                      }}
                    />
                  );
                })}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Agent Distribution */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Agent Distribution</h3>
            {positions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={positions.map(pos => ({
                      name: pos.symbol || 'Unknown',
                      value: pos.total_value || 0
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {positions.map((pos, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pos.symbol ? (AGENT_COLORS[pos.symbol] || COLORS[index % COLORS.length]) : COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value: number, name: string) => {
                      const pnl = agentPnLPercent[name] || 0;
                      return [`$${value.toLocaleString()} (${pnl >= 0 ? '+' : ''}${pnl.toFixed(1)}%)`, `Agent ${name}`];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>No positions found</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Current Positions</h3>
          {positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4">Stock</th>
                    <th className="text-left py-3 px-4">Shares</th>
                    <th className="text-left py-3 px-4">Avg Buy Price</th>
                    <th className="text-left py-3 px-4">Current Price</th>
                    <th className="text-left py-3 px-4">Value</th>
                    <th className="text-left py-3 px-4">Profit/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => {
                    const pnlPercent = position.average_price && position.current_price
                      ? (((position.current_price - position.average_price) / position.average_price) * 100)
                      : 0;
                    const isProfit = (position.unrealized_pnl || 0) >= 0;

                    return (
                      <tr key={position.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: AGENT_COLORS[position.symbol || ''] || '#8884d8' }}
                            ></div>
                            <div className="font-medium">
                              {position.symbol || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{position.quantity || '-'}</td>
                        <td className="py-3 px-4 text-gray-300">${position.average_price?.toFixed(2) || '-'}</td>
                        <td className="py-3 px-4 font-medium">${position.current_price?.toFixed(2) || '-'}</td>
                        <td className="py-3 px-4 font-medium">${position.total_value?.toLocaleString() || '-'}</td>
                        <td className={`py-3 px-4 font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                          <div className="flex flex-col">
                            <span>
                              {isProfit ? '+' : ''}${position.unrealized_pnl?.toFixed(2) || '0.00'}
                            </span>
                            <span className="text-xs opacity-80">
                              ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2" />
              <p>No positions found</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}