"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
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
  market_data: any;
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
}

export default function TradingDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradingLogs, setTradingLogs] = useState<TradingLog[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace("/");
        return;
      }
      setEmail(session.user.email ?? null);
      await loadDashboardData();
    };
    void init();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load account data from API
      const accountData = await fetchAlpacaData('account');
      if (accountData) {
        setAccount(accountData);
      }

      // Load positions from course2 table
      const { data: positionsData } = await supabase
        .from('course2')
        .select('*');
      
      if (positionsData) {
        setPositions(positionsData);
      }

      // Load trading logs from course1 table
      const { data: logs } = await supabase
        .from('course1')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (logs) {
        setTradingLogs(logs.map(log => ({
          ...log,
          timestamp: log.created_at || log.timestamp || new Date().toISOString()
        })));
      }

      // Load portfolio history from API
      const history = await fetchAlpacaData('portfolio-history');
      if (history && history.equity) {
        const formattedHistory = history.equity.map((value: number, index: number) => ({
          date: format(new Date(Date.now() - (history.equity.length - index - 1) * 24 * 60 * 60 * 1000), 'MM/dd'),
          value: value,
          pnl: index > 0 ? value - history.equity[index - 1] : 0
        }));
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
    await supabase.auth.signOut();
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
  const totalMarketValue = positions.reduce((sum, pos) => sum + (pos.total_value || 0), 0);
  const winRate = tradingLogs.filter(log => log.action === 'SELL' && (log.total_value || 0) > 0).length / 
                 Math.max(tradingLogs.filter(log => log.action === 'SELL').length, 1) * 100;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Trading Dashboard</h1>
                {email && <p className="text-sm text-gray-300">{email}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Portfolio Value</p>
                <p className="text-2xl font-bold text-white">
                  ${account?.portfolio_value?.toLocaleString() || '0'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Unrealized P&L</p>
                <p className={`text-2xl font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${totalUnrealizedPnL.toLocaleString()}
                </p>
              </div>
              {totalUnrealizedPnL >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Cash Available</p>
                <p className="text-2xl font-bold text-white">
                  ${account?.cash?.toLocaleString() || '0'}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Win Rate</p>
                <p className="text-2xl font-bold text-white">
                  {winRate.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Performance Chart */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Portfolio Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={portfolioHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
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

          {/* Positions Distribution */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Positions Distribution</h3>
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
                    {positions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
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
                    <th className="text-left py-3 px-4">Symbol</th>
                    <th className="text-left py-3 px-4">Quantity</th>
                    <th className="text-left py-3 px-4">Avg Price</th>
                    <th className="text-left py-3 px-4">Current Price</th>
                    <th className="text-left py-3 px-4">Market Value</th>
                    <th className="text-left py-3 px-4">Unrealized P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position, index) => (
                    <tr key={position.id} className="border-b border-white/10">
                      <td className="py-3 px-4 font-medium">{position.symbol || '-'}</td>
                      <td className="py-3 px-4">{position.quantity || '-'}</td>
                      <td className="py-3 px-4">${position.average_price?.toFixed(2) || '-'}</td>
                      <td className="py-3 px-4">${position.current_price?.toFixed(2) || '-'}</td>
                      <td className="py-3 px-4">${position.total_value?.toFixed(2) || '-'}</td>
                      <td className={`py-3 px-4 ${(position.unrealized_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${position.unrealized_pnl?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
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

        {/* Trading Logs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Trading Activity</h3>
          {tradingLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4">Timestamp</th>
                    <th className="text-left py-3 px-4">Action</th>
                    <th className="text-left py-3 px-4">Symbol</th>
                    <th className="text-left py-3 px-4">Quantity</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-left py-3 px-4">Value</th>
                    <th className="text-left py-3 px-4">Confidence</th>
                    <th className="text-left py-3 px-4">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {tradingLogs.map((log, index) => (
                    <tr key={log.id} className="border-b border-white/10">
                      <td className="py-3 px-4 text-sm">
                        {format(new Date(log.timestamp), 'MM/dd HH:mm')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.action === 'BUY' ? 'bg-green-500/20 text-green-400' :
                          log.action === 'SELL' ? 'bg-red-500/20 text-red-400' :
                          log.action === 'HOLD' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {log.action || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{log.symbol || '-'}</td>
                      <td className="py-3 px-4">{log.quantity || '-'}</td>
                      <td className="py-3 px-4">{log.price ? `$${log.price.toFixed(2)}` : '-'}</td>
                      <td className="py-3 px-4">{log.total_value ? `$${log.total_value.toFixed(2)}` : '-'}</td>
                      <td className="py-3 px-4">
                        {log.confidence_score ? (
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${log.confidence_score * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{(log.confidence_score * 100).toFixed(0)}%</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 max-w-xs truncate">
                        {log.reason || log.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-2" />
              <p>No trading activity found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}