"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  AlertCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

// Type definitions
interface Account {
  portfolio_value: number;
  cash: number;
  buying_power: number;
  equity: number;
  account_number?: string;
  status?: string;
}

interface Position {
  asset_id: string;
  symbol: string;
  qty: number;
  side: string;
  market_value: number;
  cost_basis: number;
  avg_entry_price: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  current_price: number;
}

interface Order {
  id: string;
  symbol: string;
  qty: string;
  side: string;
  type: string;
  status: string;
  filled_avg_price: string | null;
  submitted_at: string;
}

interface PortfolioHistory {
  equity: number[];
  timestamp: number[];
}

interface SPYData {
  bars: Array<{ t: string; c: number }>;
}

interface QQQData {
  bars: Array<{ t: string; c: number }>;
}

interface SnapshotData {
  timestamp: string;
  account: Account;
  positions: Position[];
  portfolioHistory: PortfolioHistory;
  orders: Order[];
  spyData: SPYData | null;
  qqqData: QQQData | null;
}

interface StaticDashboardProps {
  data: SnapshotData;
}

export default function StaticDashboard({ data }: StaticDashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradingLogs, setTradingLogs] = useState<Record<string, unknown>[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<Array<{date: string, value: number, pnl: number, timestamp: number}>>([]);
  const [sp500Data, setSp500Data] = useState<Array<{date: string, spyReturn: number, portfolioReturn: number}>>([]);
  const [nasdaq100Data, setNasdaq100Data] = useState<Array<{date: string, qqqReturn: number, portfolioReturn: number}>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !data) return;

    // Process account data
    setAccount(data.account);

    // Process positions
    setPositions(data.positions);

    // Process orders into trading logs
    const logs = data.orders.slice(0, 50).map((order) => ({
      id: order.id,
      title: `${order.symbol} ${order.side.toUpperCase()}`,
      description: `${order.type} order - ${order.status}`,
      action: order.side.toUpperCase(),
      symbol: order.symbol,
      quantity: parseFloat(order.qty),
      price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
      total_value: order.filled_avg_price ? parseFloat(order.filled_avg_price) * parseFloat(order.qty) : null,
      reason: `${order.type} ${order.side}`,
      confidence_score: order.status === 'filled' ? 1.0 : 0.5,
      market_data: {},
      tags: [order.status],
      timestamp: order.submitted_at
    }));
    console.log('📊 Trading logs with timestamps:', logs.filter(l => l.timestamp).length, 'out of', logs.length);
    setTradingLogs(logs);

    // Process portfolio history
    if (data.portfolioHistory?.equity && data.portfolioHistory?.timestamp) {
      const filteredHistory = data.portfolioHistory.equity
        .map((value: number, index: number) => ({
          timestamp: data.portfolioHistory.timestamp[index] * 1000,
          value: value,
        }))
        .filter((item: { timestamp: number; value: number }) => item.value > 1000);

      const hourlyData: Record<string, { timestamp: number; value: number }> = {};

      filteredHistory.forEach((item: { timestamp: number; value: number }) => {
        const date = new Date(item.timestamp);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        const hourKey = date.getTime().toString();

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
            timestamp: item.timestamp,
            value: item.value,
            pnl: index > 0 ? item.value - arr[index - 1].value : 0
          };
        });

      setPortfolioHistory(formattedHistory);

      // Process SPY comparison data
      if (data.spyData?.bars && formattedHistory.length > 0) {
        const spyBars = data.spyData.bars;
        const initialPortfolioValue = formattedHistory[0].value;
        const firstPortfolioTimestamp = formattedHistory[0].timestamp;

        // Find initial SPY price
        const validSpyBars = spyBars.filter((bar: { t: string; c: number }) =>
          new Date(bar.t).getTime() <= firstPortfolioTimestamp
        );

        if (validSpyBars.length > 0) {
          const initialSpyBar = validSpyBars.reduce((prev: { t: string; c: number }, curr: { t: string; c: number }) => {
            const prevDiff = firstPortfolioTimestamp - new Date(prev.t).getTime();
            const currDiff = firstPortfolioTimestamp - new Date(curr.t).getTime();
            return currDiff < prevDiff && currDiff >= 0 ? curr : prev;
          });
          const initialSpyPrice = initialSpyBar.c;

          // Calculate comparison data
          const rawComparisonData = formattedHistory.map((item) => {
            const itemTimestamp = item.timestamp;
            const validBarsForPoint = spyBars.filter((bar: { t: string; c: number }) =>
              new Date(bar.t).getTime() <= itemTimestamp
            );

            const closestSpyBar = validBarsForPoint.length > 0
              ? validBarsForPoint.reduce((prev: { t: string; c: number }, curr: { t: string; c: number }) => {
                  const prevTime = new Date(prev.t).getTime();
                  const currTime = new Date(curr.t).getTime();
                  return currTime > prevTime ? curr : prev;
                })
              : spyBars[0];

            const spyReturn = ((closestSpyBar.c - initialSpyPrice) / initialSpyPrice) * 100;
            const portfolioReturn = ((item.value - initialPortfolioValue) / initialPortfolioValue) * 100;

            return {
              date: item.date,
              spyReturn,
              portfolioReturn
            };
          });

          // Normalize to start at 0
          let normalizedData: Array<{date: string, spyReturn: number, portfolioReturn: number}> = [];
          if (rawComparisonData.length > 0) {
            const firstSpyReturn = rawComparisonData[0].spyReturn;
            const firstPortfolioReturn = rawComparisonData[0].portfolioReturn;

            normalizedData = rawComparisonData.map((point, idx) => ({
              date: point.date,
              spyReturn: idx === 0 ? 0 : point.spyReturn - firstSpyReturn,
              portfolioReturn: idx === 0 ? 0 : point.portfolioReturn - firstPortfolioReturn
            }));
          }

          setSp500Data(normalizedData);
        }
      }

      // Process QQQ comparison data
      if (data.qqqData?.bars && formattedHistory.length > 0) {
        const qqqBars = data.qqqData.bars;
        const initialPortfolioValue = formattedHistory[0].value;
        const firstPortfolioTimestamp = formattedHistory[0].timestamp;

        // Find initial QQQ price
        const validQqqBars = qqqBars.filter((bar: { t: string; c: number }) =>
          new Date(bar.t).getTime() <= firstPortfolioTimestamp
        );

        if (validQqqBars.length > 0) {
          const initialQqqBar = validQqqBars.reduce((prev: { t: string; c: number }, curr: { t: string; c: number }) => {
            const prevDiff = firstPortfolioTimestamp - new Date(prev.t).getTime();
            const currDiff = firstPortfolioTimestamp - new Date(curr.t).getTime();
            return currDiff < prevDiff && currDiff >= 0 ? curr : prev;
          });
          const initialQqqPrice = initialQqqBar.c;

          // Calculate comparison data
          const rawComparisonData = formattedHistory.map((item) => {
            const itemTimestamp = item.timestamp;
            const validBarsForPoint = qqqBars.filter((bar: { t: string; c: number }) =>
              new Date(bar.t).getTime() <= itemTimestamp
            );

            const closestQqqBar = validBarsForPoint.length > 0
              ? validBarsForPoint.reduce((prev: { t: string; c: number }, curr: { t: string; c: number }) => {
                  const prevTime = new Date(prev.t).getTime();
                  const currTime = new Date(curr.t).getTime();
                  return currTime > prevTime ? curr : prev;
                })
              : qqqBars[0];

            const qqqReturn = ((closestQqqBar.c - initialQqqPrice) / initialQqqPrice) * 100;
            const portfolioReturn = ((item.value - initialPortfolioValue) / initialPortfolioValue) * 100;

            return {
              date: item.date,
              qqqReturn,
              portfolioReturn
            };
          });

          // Normalize to start at 0
          let normalizedData: Array<{date: string, qqqReturn: number, portfolioReturn: number}> = [];
          if (rawComparisonData.length > 0) {
            const firstQqqReturn = rawComparisonData[0].qqqReturn;
            const firstPortfolioReturn = rawComparisonData[0].portfolioReturn;

            normalizedData = rawComparisonData.map((point, idx) => ({
              date: point.date,
              qqqReturn: idx === 0 ? 0 : point.qqqReturn - firstQqqReturn,
              portfolioReturn: idx === 0 ? 0 : point.portfolioReturn - firstPortfolioReturn
            }));
          }

          setNasdaq100Data(normalizedData);
        }
      }
    }
  }, [mounted, data]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealized_pl, 0);

  // Calculate total portfolio return from start
  const initialPortfolioValue = portfolioHistory.length > 0 ? portfolioHistory[0].value : 100000;
  const currentPortfolioValue = account?.portfolio_value || 0;
  const totalReturn = initialPortfolioValue > 0
    ? ((currentPortfolioValue - initialPortfolioValue) / initialPortfolioValue) * 100
    : 0;
  const totalReturnDollar = currentPortfolioValue - initialPortfolioValue;

  // Calculate Market Exposure
  const investedAmount = (account?.portfolio_value || 0) - (account?.cash || 0);
  const marketExposure = account?.portfolio_value
    ? (investedAmount / account.portfolio_value) * 100
    : 0;

  // Define color palette
  const COLORS = ['#8b5cf6', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#a855f7'];

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
        const baseValue = Math.abs(pos.market_value); // Use absolute value for chart display
        const variation = Math.sin(index * 0.3) * (baseValue * 0.05);
        result[pos.symbol] = baseValue + variation;
      }
    });
    return result;
  });

  // Calculate P&L % for each agent
  const agentPnLPercent: Record<string, number> = {};
  positions.forEach(pos => {
    if (pos.symbol) {
      const pnlPercent = ((pos.current_price - pos.avg_entry_price) / pos.avg_entry_price) * 100;
      agentPnLPercent[pos.symbol] = pnlPercent;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="https://static.flowhunt.io/images/logo.svg"
                alt="Flowhunt Logo"
                className="h-8"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Trading Bot</h1>
                <p className="text-xs text-gray-600">Snapshot from {new Date(data.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Total Balance */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${account?.portfolio_value?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Cash + holdings</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Card 2: Total Return */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Return</p>
                <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalReturnDollar >= 0 ? '+' : ''}${totalReturnDollar.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${totalReturn >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {totalReturn >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Market Exposure */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Market Exposure</p>
                <p className="text-2xl font-bold text-gray-900">
                  {marketExposure.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {marketExposure.toFixed(0)}% invested
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Card 4: Available to Invest */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Available to Invest</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${account?.cash?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Uninvested cash</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Performance Chart - 60/40 Split */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Stock Performance Chart - 60% width */}
          <div className="lg:col-span-3 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Stock Performance (AI Trades)</h3>
              <div className="text-sm text-gray-600">
                Unrealized P&L: <span className={`font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalUnrealizedPnL >= 0 ? '+' : ''}{((totalUnrealizedPnL / (account?.portfolio_value || 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={agentPerformanceHistory.length > 0 ? agentPerformanceHistory : portfolioHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis
                  stroke="#6B7280"
                  scale="log"
                  domain={[1000, 50000]}
                  ticks={[1000, 2000, 5000, 10000, 20000, 50000]}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#111827'
                  }}
                  formatter={(value: number, name: string) => {
                    const pnl = agentPnLPercent[name] || 0;
                    return [`$${value.toLocaleString()} (${pnl >= 0 ? '+' : ''}${pnl.toFixed(1)}%)`, `${name}`];
                  }}
                />
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
            {/* Agent P&L Callouts - Display in original color assignment order */}
            <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2">
              {positions.slice(0, 9).map((pos, originalIndex) => {
                if (!pos.symbol) return null;

                // Use the original index to get the consistent color
                const colorIndex = originalIndex % COLORS.length;

                return (
                  <div key={pos.symbol} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: COLORS[colorIndex] }}
                      ></div>
                      <span className="text-gray-700 font-medium">{pos.symbol}</span>
                    </div>
                    <span className={`font-bold ml-2 ${(agentPnLPercent[pos.symbol] || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(agentPnLPercent[pos.symbol] || 0) >= 0 ? '+' : ''}{(agentPnLPercent[pos.symbol] || 0).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Log - 40% width */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {tradingLogs.slice(0, 20).map((log) => {
                const isPending = !log.price || log.price === null;

                return (
                  <div key={log.id as string} className="bg-gray-50 rounded-lg p-2 border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {log.action === 'BUY' ? (
                          <TrendingUp className="w-3 h-3 text-green-600 flex-shrink-0" />
                        ) : log.action === 'SELL' ? (
                          <TrendingDown className="w-3 h-3 text-red-600 flex-shrink-0" />
                        ) : (
                          <Activity className="w-3 h-3 text-gray-600 flex-shrink-0" />
                        )}
                        <span className={`text-xs font-semibold ${
                          log.action === 'BUY' ? 'text-green-600' :
                          log.action === 'SELL' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {log.action as string}
                        </span>
                        <span className="text-xs text-gray-900">{log.symbol as string}</span>
                        {isPending && (
                          <span className="text-xs text-gray-500 font-semibold">(Pending)</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {isPending ? (
                          <>
                            <span className="text-xs text-gray-600">{log.quantity as number} shares</span>
                            <span className="text-xs text-gray-500 font-medium italic">Awaiting fill</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-gray-600">{log.quantity as number} @ ${(log.price as number | undefined)?.toFixed(2)}</span>
                            <span className="text-xs text-gray-900 font-medium">
                              ${(log.total_value as number | undefined)?.toLocaleString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {tradingLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No activity yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Performance & Distribution Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Value History */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Portfolio Value</h3>
              {portfolioHistory.length > 0 && (() => {
                const values = portfolioHistory.map(h => h.value);
                const max = Math.max(...values);
                const min = Math.min(...values);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;

                return (
                  <div className="flex items-center space-x-3 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">Max:</span>
                      <span className="text-green-600 font-semibold">${max.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">Min:</span>
                      <span className="text-red-600 font-semibold">${min.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">Avg:</span>
                      <span className="text-blue-600 font-semibold">${avg.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={portfolioHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis
                  stroke="#6B7280"
                  domain={[90000, 110000]}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#111827'
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;

                      // Find ALL trades at this point
                      const tradesAtPoint = tradingLogs.filter(log => {
                        if (!log.timestamp) return false;
                        const tradeTimestamp = new Date(log.timestamp as string).getTime();
                        const closestPoint = portfolioHistory.reduce((prev, curr) => {
                          const prevDiff = Math.abs(prev.timestamp - tradeTimestamp);
                          const currDiff = Math.abs(curr.timestamp - tradeTimestamp);
                          return currDiff < prevDiff ? curr : prev;
                        });
                        return closestPoint.date === data.date;
                      });

                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
                          <p className="text-gray-600 text-xs mb-1">{data.date}</p>
                          <p className="text-gray-900 font-semibold">
                            Portfolio Value: ${data.value.toLocaleString()}
                          </p>
                          {tradesAtPoint.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                              {tradesAtPoint.map((trade, idx) => (
                                <div key={idx} className={trade.action === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                                  <p className="font-bold text-sm">
                                    {trade.action} {trade.symbol}
                                  </p>
                                  <p className="text-xs">
                                    {trade.quantity} shares @ ${(trade.price as number)?.toFixed(2)}
                                  </p>
                                  <p className="text-xs font-semibold">
                                    Total: ${(trade.total_value as number)?.toLocaleString()}
                                  </p>
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
                {tradingLogs.filter(log => log.timestamp).map((log) => {
                  const tradeTimestamp = new Date(log.timestamp as string).getTime();
                  const isBuy = log.action === 'BUY';

                  // Safety check - need data points to match against
                  if (portfolioHistory.length === 0) return null;

                  // Find closest data point in portfolio history
                  const closestPoint = portfolioHistory.reduce((prev, curr) => {
                    const prevDiff = Math.abs(prev.timestamp - tradeTimestamp);
                    const currDiff = Math.abs(curr.timestamp - tradeTimestamp);
                    return currDiff < prevDiff ? curr : prev;
                  });

                  return (
                    <ReferenceLine
                      key={log.id as string}
                      x={closestPoint.date}
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
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Distribution</h3>
            {positions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={positions.map(pos => ({
                      name: pos.symbol,
                      value: Math.abs(pos.market_value) // Use absolute value for pie chart
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
                        fill={AGENT_COLORS[pos.symbol] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#111827'
                    }}
                    formatter={(value: number, name: string) => {
                      const pnl = agentPnLPercent[name] || 0;
                      return [`$${value.toLocaleString()} (${pnl >= 0 ? '+' : ''}${pnl.toFixed(1)}%)`, `Agent ${name}`];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>No positions found</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Performance vs S&P 500 */}
        {sp500Data.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Performance vs. S&P 500</h3>
                <p className="text-xs text-gray-600 mt-1">Market hours comparison</p>
              </div>
              {sp500Data.length > 0 && (() => {
                const aiReturn = sp500Data[sp500Data.length - 1].portfolioReturn;
                const spyReturn = sp500Data[sp500Data.length - 1].spyReturn;
                const outperformance = aiReturn - spyReturn;

                return (
                  <div className="flex flex-col items-end space-y-1 text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">AI:</span>
                        <span className={`font-semibold ${aiReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {aiReturn >= 0 ? '+' : ''}{aiReturn.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">S&P 500:</span>
                        <span className={`font-semibold ${spyReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {spyReturn >= 0 ? '+' : ''}{spyReturn.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">Outperformance:</span>
                      <span className={`font-semibold ${outperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {outperformance >= 0 ? '+' : ''}{outperformance.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={sp500Data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  stroke="#6B7280"
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#111827'
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;

                      // Find ALL trades at this point
                      const tradesAtPoint = tradingLogs.filter(log => {
                        if (!log.timestamp) return false;
                        const tradeTimestamp = new Date(log.timestamp as string).getTime();
                        const closestPoint = portfolioHistory.reduce((prev, curr) => {
                          const prevDiff = Math.abs(prev.timestamp - tradeTimestamp);
                          const currDiff = Math.abs(curr.timestamp - tradeTimestamp);
                          return currDiff < prevDiff ? curr : prev;
                        });
                        return closestPoint.date === data.date;
                      });

                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
                          <p className="text-gray-600 text-xs mb-1">{data.date}</p>
                          <p className="text-purple-600 font-semibold text-sm">
                            AI: {data.portfolioReturn >= 0 ? '+' : ''}{data.portfolioReturn.toFixed(2)}%
                          </p>
                          <p className="text-cyan-600 font-semibold text-sm">
                            S&P 500: {data.spyReturn >= 0 ? '+' : ''}{data.spyReturn.toFixed(2)}%
                          </p>
                          {tradesAtPoint.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                              {tradesAtPoint.map((trade, idx) => (
                                <div key={idx} className={trade.action === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                                  <p className="font-bold text-sm">
                                    {trade.action} {trade.symbol}
                                  </p>
                                  <p className="text-xs">
                                    {trade.quantity} shares @ ${(trade.price as number)?.toFixed(2)}
                                  </p>
                                  <p className="text-xs font-semibold">
                                    Total: ${(trade.total_value as number)?.toLocaleString()}
                                  </p>
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
                {tradingLogs.filter(log => log.timestamp).map((log) => {
                  const tradeTimestamp = new Date(log.timestamp as string).getTime();
                  const isBuy = log.action === 'BUY';

                  // Safety checks - need data points to match against
                  if (sp500Data.length === 0 || portfolioHistory.length === 0) return null;

                  // Find closest data point in portfolio history first
                  const closestPoint = portfolioHistory.reduce((prev, curr) => {
                    const prevDiff = Math.abs(prev.timestamp - tradeTimestamp);
                    const currDiff = Math.abs(curr.timestamp - tradeTimestamp);
                    return currDiff < prevDiff ? curr : prev;
                  });

                  // Find the corresponding sp500Data point by matching date
                  const sp500Point = sp500Data.find(h => h.date === closestPoint.date);
                  if (!sp500Point) return null;

                  return (
                    <ReferenceLine
                      key={log.id as string}
                      x={sp500Point.date}
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
                  dataKey="portfolioReturn"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={false}
                  name="AI Portfolio"
                />
                <Line
                  type="monotone"
                  dataKey="spyReturn"
                  stroke="#22D3EE"
                  strokeWidth={3}
                  dot={false}
                  name="S&P 500 Index"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-purple-500"></div>
                <span className="text-gray-700">AI Portfolio</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-cyan-400"></div>
                <span className="text-gray-700">S&P 500 Index</span>
              </div>
            </div>
          </div>
        )}

        {/* AI Performance vs NASDAQ-100 */}
        {nasdaq100Data.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Performance vs. NASDAQ-100</h3>
                <p className="text-xs text-gray-600 mt-1">Market hours comparison</p>
              </div>
              {nasdaq100Data.length > 0 && (() => {
                const aiReturn = nasdaq100Data[nasdaq100Data.length - 1].portfolioReturn;
                const qqqReturn = nasdaq100Data[nasdaq100Data.length - 1].qqqReturn;
                const outperformance = aiReturn - qqqReturn;

                return (
                  <div className="flex flex-col items-end space-y-1 text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">AI:</span>
                        <span className={`font-semibold ${aiReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {aiReturn >= 0 ? '+' : ''}{aiReturn.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">NASDAQ-100:</span>
                        <span className={`font-semibold ${qqqReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {qqqReturn >= 0 ? '+' : ''}{qqqReturn.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">Outperformance:</span>
                      <span className={`font-semibold ${outperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {outperformance >= 0 ? '+' : ''}{outperformance.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={nasdaq100Data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  stroke="#6B7280"
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#111827'
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;

                      // Find ALL trades at this point
                      const tradesAtPoint = tradingLogs.filter(log => {
                        if (!log.timestamp) return false;
                        const tradeTimestamp = new Date(log.timestamp as string).getTime();
                        const closestPoint = portfolioHistory.reduce((prev, curr) => {
                          const prevDiff = Math.abs(prev.timestamp - tradeTimestamp);
                          const currDiff = Math.abs(curr.timestamp - tradeTimestamp);
                          return currDiff < prevDiff ? curr : prev;
                        });
                        return closestPoint.date === data.date;
                      });

                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
                          <p className="text-gray-600 text-xs mb-1">{data.date}</p>
                          <p className="text-purple-600 font-semibold text-sm">
                            AI: {data.portfolioReturn >= 0 ? '+' : ''}{data.portfolioReturn.toFixed(2)}%
                          </p>
                          <p className="text-red-600 font-semibold text-sm">
                            NASDAQ-100: {data.qqqReturn >= 0 ? '+' : ''}{data.qqqReturn.toFixed(2)}%
                          </p>
                          {tradesAtPoint.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                              {tradesAtPoint.map((trade, idx) => (
                                <div key={idx} className={trade.action === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                                  <p className="font-bold text-sm">
                                    {trade.action} {trade.symbol}
                                  </p>
                                  <p className="text-xs">
                                    {trade.quantity} shares @ ${(trade.price as number)?.toFixed(2)}
                                  </p>
                                  <p className="text-xs font-semibold">
                                    Total: ${(trade.total_value as number)?.toLocaleString()}
                                  </p>
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
                {tradingLogs.filter(log => log.timestamp).map((log) => {
                  const tradeTimestamp = new Date(log.timestamp as string).getTime();
                  const isBuy = log.action === 'BUY';

                  // Safety checks - need data points to match against
                  if (nasdaq100Data.length === 0 || portfolioHistory.length === 0) return null;

                  // Find closest data point in portfolio history first
                  const closestPoint = portfolioHistory.reduce((prev, curr) => {
                    const prevDiff = Math.abs(prev.timestamp - tradeTimestamp);
                    const currDiff = Math.abs(curr.timestamp - tradeTimestamp);
                    return currDiff < prevDiff ? curr : prev;
                  });

                  // Find the corresponding nasdaq100Data point by matching date
                  const nasdaq100Point = nasdaq100Data.find(h => h.date === closestPoint.date);
                  if (!nasdaq100Point) return null;

                  return (
                    <ReferenceLine
                      key={log.id as string}
                      x={nasdaq100Point.date}
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
                  dataKey="portfolioReturn"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={false}
                  name="AI Portfolio"
                />
                <Line
                  type="monotone"
                  dataKey="qqqReturn"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={false}
                  name="NASDAQ-100 Index"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-purple-500"></div>
                <span className="text-gray-700">AI Portfolio</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-red-500"></div>
                <span className="text-gray-700">NASDAQ-100 Index</span>
              </div>
            </div>
          </div>
        )}

        {/* Positions Table */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Positions</h3>
          {positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-gray-900">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Stock</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Shares</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Avg Buy Price</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Current Price</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Value</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Profit/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => {
                    const pnlPercent = ((position.current_price - position.avg_entry_price) / position.avg_entry_price) * 100;
                    const isProfit = position.unrealized_pl >= 0;

                    return (
                      <tr key={position.asset_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: AGENT_COLORS[position.symbol] || '#8884d8' }}
                            ></div>
                            <div className="font-medium">{position.symbol}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{position.qty}</td>
                        <td className="py-3 px-4 text-gray-600">${position.avg_entry_price.toFixed(2)}</td>
                        <td className="py-3 px-4 font-medium">${position.current_price.toFixed(2)}</td>
                        <td className="py-3 px-4 font-medium">${position.market_value.toLocaleString()}</td>
                        <td className={`py-3 px-4 font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          <div className="flex flex-col">
                            <span>{isProfit ? '+' : ''}${position.unrealized_pl.toFixed(2)}</span>
                            <span className="text-xs opacity-80">({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2" />
              <p>No positions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
