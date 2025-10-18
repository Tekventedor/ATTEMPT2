#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const OUTPUT_DIR = path.join(process.cwd(), 'hugo-export');

// Alpaca API configuration
const ALPACA_CONFIG = {
  baseUrl: 'https://paper-api.alpaca.markets',
  apiKey: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
};

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;

function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Helper function to make authenticated requests to Alpaca
async function alpacaRequest(endpoint: string) {
  if (!ALPACA_CONFIG.apiKey || !ALPACA_CONFIG.secretKey) {
    throw new Error('Alpaca API credentials not configured. Please set ALPACA_API_KEY and ALPACA_SECRET_KEY environment variables.');
  }

  const response = await fetch(`${ALPACA_CONFIG.baseUrl}${endpoint}`, {
    headers: {
      'APCA-API-KEY-ID': ALPACA_CONFIG.apiKey,
      'APCA-API-SECRET-KEY': ALPACA_CONFIG.secretKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Alpaca API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Fetch snapshot data from Alpaca API
async function fetchSnapshotData() {
  console.log('📊 Fetching snapshot data from Alpaca API...\n');

  // 1. Fetch account data
  console.log('💰 Fetching account data...');
  const accountRaw = await alpacaRequest('/v2/account');
  const account = {
    portfolio_value: parseFloat(accountRaw.portfolio_value),
    cash: parseFloat(accountRaw.cash),
    buying_power: parseFloat(accountRaw.buying_power),
    equity: parseFloat(accountRaw.equity),
    account_number: accountRaw.account_number,
    status: accountRaw.status,
  };
  console.log(`   ✓ Portfolio Value: $${account.portfolio_value.toLocaleString()}`);

  // 2. Fetch positions
  console.log('📈 Fetching positions...');
  const positionsRaw = await alpacaRequest('/v2/positions');
  const positions = positionsRaw.map((pos: any) => ({
    asset_id: pos.asset_id,
    symbol: pos.symbol,
    qty: parseFloat(pos.qty),
    side: pos.side,
    market_value: parseFloat(pos.market_value),
    cost_basis: parseFloat(pos.cost_basis),
    avg_entry_price: parseFloat(pos.avg_entry_price),
    unrealized_pl: parseFloat(pos.unrealized_pl),
    unrealized_plpc: parseFloat(pos.unrealized_plpc),
    current_price: parseFloat(pos.current_price),
  }));
  console.log(`   ✓ ${positions.length} positions found`);

  // 3. Fetch portfolio history
  console.log('📊 Fetching portfolio history...');
  const historyRaw = await alpacaRequest('/v2/account/portfolio/history?period=1W&timeframe=1H');
  const portfolioHistory = {
    equity: historyRaw.equity,
    timestamp: historyRaw.timestamp,
  };
  console.log(`   ✓ ${portfolioHistory.equity?.length || 0} data points`);

  // 4. Fetch recent orders
  console.log('📝 Fetching recent orders...');
  const orders = await alpacaRequest('/v2/orders?status=all&limit=50&direction=desc');
  console.log(`   ✓ ${orders.length} orders found`);

  // 5. Fetch SPY data for comparison
  let spyData = null;
  if (TWELVE_DATA_API_KEY && portfolioHistory.equity && portfolioHistory.timestamp &&
      Array.isArray(portfolioHistory.equity) && portfolioHistory.equity.length > 0) {
    console.log('📈 Fetching SPY data from Twelve Data API...');

    const portfolioStartTimestamp = portfolioHistory.timestamp[0] * 1000;
    const portfolioEndTimestamp = portfolioHistory.timestamp[portfolioHistory.timestamp.length - 1] * 1000;

    const startDate = new Date(portfolioStartTimestamp - (24 * 60 * 60 * 1000));
    const endDate = new Date(portfolioEndTimestamp);

    const startISO = startDate.toISOString().split('T')[0];
    const endISO = endDate.toISOString().split('T')[0];

    console.log(`   Range: ${startISO} to ${endISO}`);

    try {
      const twelveDataUrl = `https://api.twelvedata.com/time_series?symbol=SPY&interval=1h&start_date=${startISO}&end_date=${endISO}&apikey=${TWELVE_DATA_API_KEY}&format=JSON`;
      const spyResponse = await fetch(twelveDataUrl);

      if (spyResponse.ok) {
        const data = await spyResponse.json();

        if (data?.values && Array.isArray(data.values) && data.values.length > 0) {
          const bars = data.values.reverse().map((bar: any) => ({
            t: new Date(bar.datetime).toISOString(),
            c: parseFloat(bar.close),
          }));
          spyData = { bars };
          console.log(`   ✓ ${bars.length} SPY data points fetched`);
        } else {
          console.log('   ⚠️  No SPY data returned from API');
        }
      } else {
        console.log(`   ⚠️  SPY API error: ${spyResponse.status}`);
      }
    } catch (error) {
      console.log('   ⚠️  Failed to fetch SPY data:', error instanceof Error ? error.message : 'Unknown error');
    }
  } else {
    console.log('⚠️  Skipping SPY data (Twelve Data API key not configured or no portfolio history)');
  }

  return {
    timestamp: new Date().toISOString(),
    account,
    positions,
    portfolioHistory,
    orders,
    spyData,
  };
}

async function generateHugoExport() {
  console.log('🚀 Starting Hugo export...\n');

  // 1. Fetch snapshot data directly
  const snapshotData = await fetchSnapshotData();
  console.log(`\n📸 Snapshot generated at ${snapshotData.timestamp}`);

  // 2. Create output directories
  console.log('\n📁 Creating output directories...');
  ensureDirectoryExists(OUTPUT_DIR);
  ensureDirectoryExists(path.join(OUTPUT_DIR, 'static', 'trading-dashboard'));
  console.log(`   ✓ Output directory: ${OUTPUT_DIR}`);

  // 3. Save snapshot data directly to final destination
  console.log('💾 Saving snapshot data...');
  const dataOutputPath = path.join(OUTPUT_DIR, 'static', 'trading-dashboard', 'snapshot.json');
  fs.writeFileSync(dataOutputPath, JSON.stringify(snapshotData, null, 2));
  console.log(`   ✓ Saved: ${dataOutputPath}`);
  console.log(`   📦 Data size: ${(JSON.stringify(snapshotData).length / 1024).toFixed(2)} KB`);

  // 4. Build the dashboard bundle
  console.log('\n📦 Building dashboard bundle...');
  const { execSync } = require('child_process');
  execSync('tsx scripts/build-dashboard-bundle.ts', { stdio: 'inherit' });

  console.log('\n✅ Hugo export completed successfully!');
  console.log('\n📦 Output structure:');
  console.log('   hugo-export/');
  console.log('   ├── layouts/shortcodes/');
  console.log('   │   └── trading-dashboard.html');
  console.log('   └── static/trading-dashboard/');
  console.log('       ├── dashboard-new.html');
  console.log('       ├── dashboard-bundle.js');
  console.log('       └── snapshot.json');
  console.log('\n💡 Next steps:');
  console.log('   1. Copy hugo-export/ contents to your Hugo site');
  console.log('   2. Use {{< trading-dashboard >}} in any Hugo page');
  console.log('   3. Re-run "npm run hugo:update" to refresh with latest data\n');
}

function generateStandaloneHTML(snapshotData: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flowhunt AI Trading Bot Dashboard</title>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- React (UMD) -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

  <!-- Recharts UMD - using working version from jsDelivr -->
  <script src="https://cdn.jsdelivr.net/npm/recharts@2.1.16/dist/Recharts.min.js"></script>

  <!-- Babel Standalone for JSX -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #dashboard-root {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="dashboard-root"></div>

  <!-- Embedded Snapshot Data -->
  <script>
    window.DASHBOARD_DATA = ${JSON.stringify(snapshotData, null, 2)};
  </script>

  <!-- Dashboard Component -->
  <script type="text/babel">
    const { useState, useEffect } = React;
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } = Recharts;

    // Simple date formatting helper
    function formatDate(date, formatStr) {
      const d = new Date(date);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');

      if (formatStr === 'MM/dd HH:mm') {
        return month + '/' + day + ' ' + hours + ':' + minutes;
      }
      return d.toLocaleString();
    }

    function StaticDashboard({ data }) {
      const [mounted, setMounted] = useState(false);
      const [account, setAccount] = useState(null);
      const [positions, setPositions] = useState([]);
      const [tradingLogs, setTradingLogs] = useState([]);
      const [portfolioHistory, setPortfolioHistory] = useState([]);
      const [sp500Data, setSp500Data] = useState([]);

      useEffect(() => {
        setMounted(true);
      }, []);

      useEffect(() => {
        if (!mounted || !data) return;

        // Process data (simplified version - full processing logic would be extensive)
        setAccount(data.account);
        setPositions(data.positions);

        // Process orders into trading logs
        const logs = data.orders.slice(0, 50).map((order) => ({
          id: order.id,
          title: order.symbol + ' ' + order.side.toUpperCase(),
          description: order.type + ' order - ' + order.status,
          action: order.side.toUpperCase(),
          symbol: order.symbol,
          quantity: parseFloat(order.qty),
          price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
          total_value: order.filled_avg_price ? parseFloat(order.filled_avg_price) * parseFloat(order.qty) : null,
          reason: order.type + ' ' + order.side,
          confidence_score: order.status === 'filled' ? 1.0 : 0.5,
          tags: [order.status],
          timestamp: order.submitted_at
        }));
        setTradingLogs(logs);

        // Process portfolio history (simplified)
        if (data.portfolioHistory?.equity && data.portfolioHistory?.timestamp) {
          const history = data.portfolioHistory.equity
            .map((value, index) => ({
              timestamp: data.portfolioHistory.timestamp[index] * 1000,
              value: value,
            }))
            .filter((item) => item.value > 1000);

          const formattedHistory = history.map((item, index) => ({
            date: formatDate(item.timestamp, 'MM/dd HH:mm'),
            timestamp: item.timestamp,
            value: item.value,
            pnl: index > 0 ? item.value - history[index - 1].value : 0
          }));

          setPortfolioHistory(formattedHistory);

          // Process SPY data (simplified)
          if (data.spyData?.bars && formattedHistory.length > 0) {
            const spyBars = data.spyData.bars;
            const initialPortfolioValue = formattedHistory[0].value;
            const firstPortfolioTimestamp = formattedHistory[0].timestamp;

            const validSpyBars = spyBars.filter((bar) =>
              new Date(bar.t).getTime() <= firstPortfolioTimestamp
            );

            if (validSpyBars.length > 0) {
              const initialSpyBar = validSpyBars.reduce((prev, curr) => {
                const prevDiff = firstPortfolioTimestamp - new Date(prev.t).getTime();
                const currDiff = firstPortfolioTimestamp - new Date(curr.t).getTime();
                return currDiff < prevDiff && currDiff >= 0 ? curr : prev;
              });
              const initialSpyPrice = initialSpyBar.c;

              const comparisonData = formattedHistory.map((item, idx) => {
                const itemTimestamp = item.timestamp;
                const validBarsForPoint = spyBars.filter((bar) =>
                  new Date(bar.t).getTime() <= itemTimestamp
                );

                const closestSpyBar = validBarsForPoint.length > 0
                  ? validBarsForPoint.reduce((prev, curr) => {
                      const prevTime = new Date(prev.t).getTime();
                      const currTime = new Date(curr.t).getTime();
                      return currTime > prevTime ? curr : prev;
                    })
                  : spyBars[0];

                const spyReturn = ((closestSpyBar.c - initialSpyPrice) / initialSpyPrice) * 100;
                const portfolioReturn = ((item.value - initialPortfolioValue) / initialPortfolioValue) * 100;

                return {
                  date: item.date,
                  spyReturn: idx === 0 ? 0 : spyReturn - ((spyBars[0].c - initialSpyPrice) / initialSpyPrice) * 100,
                  portfolioReturn: idx === 0 ? 0 : portfolioReturn - ((formattedHistory[0].value - initialPortfolioValue) / initialPortfolioValue) * 100
                };
              });

              setSp500Data(comparisonData);
            }
          }
        }
      }, [mounted, data]);

      if (!mounted) {
        return React.createElement('div', {
          className: 'min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center'
        }, React.createElement('div', { className: 'text-white text-xl' }, 'Loading dashboard...'));
      }

      const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealized_pl, 0);
      const initialPortfolioValue = portfolioHistory.length > 0 ? portfolioHistory[0].value : 100000;
      const currentPortfolioValue = account?.portfolio_value || 0;
      const totalReturn = initialPortfolioValue > 0
        ? ((currentPortfolioValue - initialPortfolioValue) / initialPortfolioValue) * 100
        : 0;
      const totalReturnDollar = currentPortfolioValue - initialPortfolioValue;
      const investedAmount = (account?.portfolio_value || 0) - (account?.cash || 0);
      const marketExposure = account?.portfolio_value
        ? (investedAmount / account.portfolio_value) * 100
        : 0;

      const COLORS = ['#8b5cf6', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#a855f7'];
      const AGENT_COLORS = {};
      positions.forEach((pos, index) => {
        if (pos.symbol && !AGENT_COLORS[pos.symbol]) {
          AGENT_COLORS[pos.symbol] = COLORS[index % COLORS.length];
        }
      });

      const agentPnLPercent = {};
      positions.forEach(pos => {
        if (pos.symbol) {
          const pnlPercent = ((pos.current_price - pos.avg_entry_price) / pos.avg_entry_price) * 100;
          agentPnLPercent[pos.symbol] = pnlPercent;
        }
      });

      // Due to complexity, we'll render a simplified version focusing on key metrics
      return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8' },
        React.createElement('div', { className: 'max-w-7xl mx-auto' },
          // Header
          React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20' },
            React.createElement('div', { className: 'flex items-center space-x-4' },
              React.createElement('h1', { className: 'text-3xl font-bold text-white' }, 'Flowhunt AI Trading Bot Dashboard'),
              React.createElement('p', { className: 'text-sm text-gray-300' }, 'Snapshot from ' + new Date(data.timestamp).toLocaleString())
            )
          ),

          // Stats Grid
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-6 mb-8' },
            // Total Balance Card
            React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20' },
              React.createElement('p', { className: 'text-gray-300 text-sm mb-2' }, 'Total Balance'),
              React.createElement('p', { className: 'text-3xl font-bold text-white' }, '$' + (account?.portfolio_value?.toLocaleString() || '0')),
              React.createElement('p', { className: 'text-xs text-gray-400 mt-1' }, 'Cash + holdings')
            ),

            // Total Return Card
            React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20' },
              React.createElement('p', { className: 'text-gray-300 text-sm mb-2' }, 'Total Return'),
              React.createElement('p', {
                className: 'text-3xl font-bold ' + (totalReturn >= 0 ? 'text-green-400' : 'text-red-400')
              }, (totalReturn >= 0 ? '+' : '') + totalReturn.toFixed(2) + '%'),
              React.createElement('p', { className: 'text-xs text-gray-400 mt-1' },
                (totalReturnDollar >= 0 ? '+' : '') + '$' + totalReturnDollar.toLocaleString()
              )
            ),

            // Market Exposure Card
            React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20' },
              React.createElement('p', { className: 'text-gray-300 text-sm mb-2' }, 'Market Exposure'),
              React.createElement('p', { className: 'text-3xl font-bold text-white' }, marketExposure.toFixed(0) + '%'),
              React.createElement('p', { className: 'text-xs text-gray-400 mt-1' }, marketExposure.toFixed(0) + '% invested')
            ),

            // Available Cash Card
            React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20' },
              React.createElement('p', { className: 'text-gray-300 text-sm mb-2' }, 'Available Cash'),
              React.createElement('p', { className: 'text-3xl font-bold text-white' }, '$' + (account?.cash?.toLocaleString() || '0')),
              React.createElement('p', { className: 'text-xs text-gray-400 mt-1' }, 'Uninvested')
            )
          ),

          // Positions Table
          React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-8' },
            React.createElement('h3', { className: 'text-lg font-semibold text-white mb-4' }, 'Current Positions'),
            positions.length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
              React.createElement('table', { className: 'w-full text-white' },
                React.createElement('thead', {},
                  React.createElement('tr', { className: 'border-b border-white/20' },
                    React.createElement('th', { className: 'text-left py-3 px-4' }, 'Stock'),
                    React.createElement('th', { className: 'text-left py-3 px-4' }, 'Shares'),
                    React.createElement('th', { className: 'text-left py-3 px-4' }, 'Avg Buy Price'),
                    React.createElement('th', { className: 'text-left py-3 px-4' }, 'Current Price'),
                    React.createElement('th', { className: 'text-left py-3 px-4' }, 'Value'),
                    React.createElement('th', { className: 'text-left py-3 px-4' }, 'Profit/Loss')
                  )
                ),
                React.createElement('tbody', {},
                  positions.map((position) => {
                    const pnlPercent = ((position.current_price - position.avg_entry_price) / position.avg_entry_price) * 100;
                    const isProfit = position.unrealized_pl >= 0;

                    return React.createElement('tr', { key: position.asset_id, className: 'border-b border-white/10' },
                      React.createElement('td', { className: 'py-3 px-4 font-medium' }, position.symbol),
                      React.createElement('td', { className: 'py-3 px-4' }, position.qty),
                      React.createElement('td', { className: 'py-3 px-4 text-gray-300' }, '$' + position.avg_entry_price.toFixed(2)),
                      React.createElement('td', { className: 'py-3 px-4 font-medium' }, '$' + position.current_price.toFixed(2)),
                      React.createElement('td', { className: 'py-3 px-4 font-medium' }, '$' + position.market_value.toLocaleString()),
                      React.createElement('td', { className: 'py-3 px-4 font-semibold ' + (isProfit ? 'text-green-400' : 'text-red-400') },
                        React.createElement('div', {},
                          React.createElement('div', {}, (isProfit ? '+' : '') + '$' + position.unrealized_pl.toFixed(2)),
                          React.createElement('div', { className: 'text-xs opacity-80' }, '(' + (isProfit ? '+' : '') + pnlPercent.toFixed(2) + '%)')
                        )
                      )
                    );
                  })
                )
              )
            ) : React.createElement('p', { className: 'text-center text-gray-400 py-8' }, 'No positions found')
          ),

          // Recent Activity
          React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20' },
            React.createElement('h3', { className: 'text-lg font-semibold text-white mb-4' }, 'Recent Activity'),
            React.createElement('div', { className: 'space-y-2' },
              tradingLogs.slice(0, 10).map((log) =>
                React.createElement('div', { key: log.id, className: 'bg-white/5 rounded-lg p-3 border border-white/10' },
                  React.createElement('div', { className: 'flex justify-between items-center' },
                    React.createElement('div', {},
                      React.createElement('span', {
                        className: 'font-semibold ' + (log.action === 'BUY' ? 'text-green-400' : 'text-red-400')
                      }, log.action + ' ' + log.symbol),
                      React.createElement('span', { className: 'text-gray-300 ml-2' }, log.quantity + ' shares')
                    ),
                    React.createElement('div', { className: 'text-white font-medium' },
                      log.price ? '$' + log.total_value?.toLocaleString() : 'Pending'
                    )
                  )
                )
              )
            )
          )
        )
      );
    }

    // Initialize the dashboard
    const rootElement = document.getElementById('dashboard-root');
    ReactDOM.createRoot(rootElement).render(<StaticDashboard data={window.DASHBOARD_DATA} />);
  </script>
</body>
</html>`;
}

function generateShortcode(): string {
  return `<div class="trading-dashboard-wrapper" style="width: 100%; min-height: 600px;">
  <iframe
    src="/trading-dashboard/dashboard.html"
    style="width: 100%; min-height: 800px; border: none; border-radius: 8px;"
    title="Trading Dashboard"
    loading="lazy">
  </iframe>
</div>`;
}

// Run if called directly
if (require.main === module) {
  generateHugoExport()
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to generate Hugo export:', error);
      process.exit(1);
    });
}

export { generateHugoExport };
