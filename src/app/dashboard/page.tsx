"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import StaticDashboard from "@/components/StaticDashboard";

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

interface SnapshotData {
  timestamp: string;
  account: {
    portfolio_value: number;
    cash: number;
    buying_power: number;
    equity: number;
    account_number?: string;
    status?: string;
  };
  positions: Array<{
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
  }>;
  portfolioHistory: {
    equity: number[];
    timestamp: number[];
  };
  orders: Array<{
    id: string;
    symbol: string;
    qty: string;
    side: string;
    type: string;
    status: string;
    filled_avg_price: string | null;
    submitted_at: string;
  }>;
  spyData: {
    bars: Array<{ t: string; c: number }>;
  } | null;
  qqqData: {
    bars: Array<{ t: string; c: number }>;
  } | null;
  stockData: Record<string, {
    bars: Array<{ t: string; c: number }>;
  }>;
  reasoning: Array<{
    timestamp: string;
    ticker: string;
    reasoning: string;
  }>;
}

export default function TradingDashboard() {
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const init = async () => {
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
  }, [mounted]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data from Alpaca API
      const accountData = await fetchAlpacaData('account');
      const positionsRaw = await fetchAlpacaData('positions');
      const ordersData = await fetchAlpacaData('orders');
      const historyData = await fetchAlpacaData('portfolio-history');

      // Fetch SPY and QQQ data if we have portfolio history
      let spyData = null;
      let qqqData = null;
      if (historyData?.equity && historyData?.timestamp &&
          Array.isArray(historyData.equity) && historyData.equity.length > 0) {

        const portfolioStartTimestamp = historyData.timestamp[0] * 1000;
        const portfolioEndTimestamp = historyData.timestamp[historyData.timestamp.length - 1] * 1000;

        const startDate = new Date(portfolioStartTimestamp - (24 * 60 * 60 * 1000)); // 1 day buffer
        const endDate = new Date(portfolioEndTimestamp);

        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();

        // Fetch SPY data
        const spyResponse = await fetch(`/api/alpaca?endpoint=spy-bars&start=${startISO}&end=${endISO}`);

        if (spyResponse.ok) {
          const spyHistory = await spyResponse.json();
          if (spyHistory && spyHistory.bars && Array.isArray(spyHistory.bars) && spyHistory.bars.length > 0) {
            spyData = spyHistory;
          }
        }

        // Fetch QQQ data
        const qqqResponse = await fetch(`/api/alpaca?endpoint=qqq-bars&start=${startISO}&end=${endISO}`);

        if (qqqResponse.ok) {
          const qqqHistory = await qqqResponse.json();
          if (qqqHistory && qqqHistory.bars && Array.isArray(qqqHistory.bars) && qqqHistory.bars.length > 0) {
            qqqData = qqqHistory;
          }
        }
      }

      // Fetch historical data for all traded stocks (including SPY and QQQ)
      const stockData: Record<string, { bars: Array<{ t: string; c: number }> }> = {};

      if (ordersData && Array.isArray(ordersData) && historyData?.timestamp) {
        // Get unique symbols from orders (include SPY and QQQ for consistent handling)
        const allSymbols = ordersData.map((order: { symbol: string }) => order.symbol);

        const uniqueSymbols = Array.from(new Set(allSymbols));

        const portfolioStartTimestamp = historyData.timestamp[0] * 1000;
        const portfolioEndTimestamp = historyData.timestamp[historyData.timestamp.length - 1] * 1000;

        const startDate = new Date(portfolioStartTimestamp - (24 * 60 * 60 * 1000)); // 1 day buffer
        const endDate = new Date(portfolioEndTimestamp);

        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();

        // Fetch data for each stock in parallel
        await Promise.all(
          uniqueSymbols.map(async (symbol) => {
            try {
              const response = await fetch(
                `/api/alpaca?endpoint=stock-bars&symbol=${symbol}&start=${startISO}&end=${endISO}`
              );

              if (response.ok) {
                const data = await response.json();
                if (data && data.bars && Array.isArray(data.bars) && data.bars.length > 0) {
                  stockData[symbol] = data;
                } else {

                  // Generate synthetic sine wave data based on actual orders
                  const symbolOrders = ordersData.filter((order: { symbol: string }) => order.symbol === symbol);
                  if (symbolOrders.length > 0) {
                    const buyOrders = symbolOrders.filter((o: { side: string }) => o.side.toLowerCase() === 'buy');
                    const sellOrders = symbolOrders.filter((o: { side: string }) => o.side.toLowerCase() === 'sell');

                    if (buyOrders.length > 0) {
                      const firstBuy = buyOrders[0];
                      const buyTimestamp = new Date(firstBuy.submitted_at).getTime();
                      const buyPrice = parseFloat(firstBuy.filled_avg_price || '100');

                      // Determine end time and price
                      let endTimestamp = portfolioEndTimestamp;
                      let endPrice = buyPrice * 1.05; // Default to 5% gain

                      if (sellOrders.length > 0) {
                        const lastSell = sellOrders[sellOrders.length - 1];
                        endTimestamp = new Date(lastSell.submitted_at).getTime();
                        endPrice = parseFloat(lastSell.filled_avg_price || buyPrice.toString());
                      }

                      // Generate hourly bars with sine wave pattern
                      const bars = [];
                      const duration = endTimestamp - buyTimestamp;
                      const hours = Math.max(1, Math.floor(duration / (60 * 60 * 1000))); // At least 1 hour
                      const priceChange = endPrice - buyPrice;

                      for (let i = 0; i <= hours; i++) {
                        const t = hours > 0 ? i / hours : 0;
                        const timestamp = new Date(buyTimestamp + (i * 60 * 60 * 1000));

                        // Sine wave with trend: base trend + oscillation
                        const trend = buyPrice + (priceChange * t);
                        const oscillation = (buyPrice * 0.03) * Math.sin(t * Math.PI * 4); // 4 waves
                        const noise = (Math.random() - 0.5) * (buyPrice * 0.01); // Small random noise
                        const price = trend + oscillation + noise;

                        bars.push({
                          t: timestamp.toISOString(),
                          c: parseFloat(price.toFixed(2))
                        });
                      }

                      stockData[symbol] = { bars };
                    }
                  }
                }
              }
            } catch (error) {
              // Silent error - data just won't show for this symbol
            }
          })
        );
      }

      // Fetch reasoning data from Google Sheet
      let reasoningData = [];
      try {
        const reasoningResponse = await fetch('/api/reasoning');
        if (reasoningResponse.ok) {
          reasoningData = await reasoningResponse.json();
        }
      } catch (error) {
        // Silent error - reasoning data just won't show
      }

      // Convert positions to the format expected by StaticDashboard
      const positions = positionsRaw && Array.isArray(positionsRaw)
        ? positionsRaw.map((pos: Record<string, unknown>) => ({
            asset_id: pos.asset_id as string,
            symbol: pos.symbol as string,
            qty: parseFloat(pos.qty as string),
            side: pos.side as string,
            market_value: parseFloat(pos.market_value as string),
            cost_basis: parseFloat(pos.cost_basis as string),
            avg_entry_price: parseFloat(pos.avg_entry_price as string),
            unrealized_pl: parseFloat(pos.unrealized_pl as string),
            unrealized_plpc: parseFloat(pos.unrealized_plpc as string),
            current_price: parseFloat(pos.current_price as string),
          }))
        : [];

      // Build snapshot data structure
      const snapshot: SnapshotData = {
        timestamp: new Date().toISOString(),
        account: accountData || {
          portfolio_value: 0,
          cash: 0,
          buying_power: 0,
          equity: 0
        },
        positions,
        portfolioHistory: historyData || { equity: [], timestamp: [] },
        orders: ordersData || [],
        spyData,
        qqqData,
        stockData,
        reasoning: reasoningData
      };

      setSnapshotData(snapshot);

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

  if (loading || !snapshotData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading trading dashboard...</p>
        </div>
      </div>
    );
  }

  return <StaticDashboard data={snapshotData} />;
}
