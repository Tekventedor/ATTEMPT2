import { NextRequest, NextResponse } from 'next/server';

// Alpaca API configuration for tradingbot account
const ALPACA_CONFIG = {
  baseUrl: 'https://paper-api.alpaca.markets',
  apiKey: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
};

const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
const ALPACA_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes for Alpaca data (more frequent updates)

// Simple in-memory cache for localhost (works without Vercel)
const memoryCache: Record<string, { data: any; timestamp: number }> = {};

// Helper function to make authenticated requests to Alpaca
async function alpacaRequest(endpoint: string) {
  if (!ALPACA_CONFIG.apiKey || !ALPACA_CONFIG.secretKey) {
    throw new Error('Alpaca API credentials not configured');
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

// Helper function to display cache summary
function logCacheSummary() {
  const now = Date.now();
  console.log('\n📊 ========== CACHE STATUS ==========');

  const cacheKeys = Object.keys(memoryCache);
  if (cacheKeys.length === 0) {
    console.log('❌ No cached data available');
  } else {
    cacheKeys.forEach(key => {
      const cached = memoryCache[key];
      const ageMs = now - cached.timestamp;
      const ageMinutes = Math.floor(ageMs / (1000 * 60));
      const ageHours = Math.floor(ageMs / (1000 * 60 * 60));

      let ageDisplay = '';
      if (ageHours > 0) {
        ageDisplay = `${ageHours}h ${ageMinutes % 60}m`;
      } else {
        ageDisplay = `${ageMinutes}m`;
      }

      const isExpired = ageMs > (key.includes('stock-bars') || key.includes('spy-bars') || key.includes('qqq-bars')
        ? CACHE_DURATION_MS
        : ALPACA_CACHE_DURATION_MS);

      const status = isExpired ? '⏰ EXPIRED' : '✅ VALID';

      console.log(`${status} | ${key.padEnd(40)} | Age: ${ageDisplay}`);
    });
  }
  console.log('====================================\n');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  console.log(`\n📥 API Request: ${endpoint}`);

  try {
    switch (endpoint) {
      case 'account': {
        // Get account information from tradingbot account
        const cacheKey = 'alpaca-account';
        const now = Date.now();

        // Check cache
        const cached = memoryCache[cacheKey];
        if (cached && (now - cached.timestamp) < ALPACA_CACHE_DURATION_MS) {
          const ageMinutes = Math.floor((now - cached.timestamp) / (1000 * 60));
          console.log(`📦 Account: Using cached data (${ageMinutes}m old)`);
          return NextResponse.json(cached.data);
        }

        // Fetch fresh data
        console.log(`🌐 Account: Fetching fresh data from Alpaca...`);
        const account = await alpacaRequest('/v2/account');

        const responseData = {
          portfolio_value: parseFloat(account.portfolio_value),
          cash: parseFloat(account.cash),
          buying_power: parseFloat(account.buying_power),
          equity: parseFloat(account.equity),
          account_number: account.account_number,
          status: account.status,
        };

        // Cache for 5 minutes
        memoryCache[cacheKey] = { data: responseData, timestamp: now };
        console.log(`✅ Account: Cached for 5 minutes (Portfolio: $${responseData.portfolio_value.toLocaleString()})`);

        return NextResponse.json(responseData);
      }
      
      case 'positions': {
        // Get current positions from tradingbot account
        const cacheKey = 'alpaca-positions';
        const now = Date.now();

        // Check cache
        const cached = memoryCache[cacheKey];
        if (cached && (now - cached.timestamp) < ALPACA_CACHE_DURATION_MS) {
          const ageMinutes = Math.floor((now - cached.timestamp) / (1000 * 60));
          console.log(`📦 Positions: Using cached data (${ageMinutes}m old, ${cached.data.length} positions)`);
          return NextResponse.json(cached.data);
        }

        // Fetch fresh data
        console.log(`🌐 Positions: Fetching fresh data from Alpaca...`);
        const positions = await alpacaRequest('/v2/positions');

        const responseData = positions.map((pos: Record<string, unknown>) => ({
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
        }));

        const positionSymbols = responseData.map((p: any) => p.symbol).join(', ');

        // Cache for 5 minutes
        memoryCache[cacheKey] = { data: responseData, timestamp: now };
        console.log(`✅ Positions: Cached for 5 minutes (${responseData.length} positions: ${positionSymbols})`);

        return NextResponse.json(responseData);
      }
      
      case 'portfolio-history': {
        // Get portfolio history from tradingbot account - hourly data for detailed chart
        // Use 1M (1 month) to capture all October trades from Oct 6 onwards
        const cacheKey = 'alpaca-portfolio-history';
        const now = Date.now();

        // Check cache
        const cached = memoryCache[cacheKey];
        if (cached && (now - cached.timestamp) < ALPACA_CACHE_DURATION_MS) {
          const ageMinutes = Math.floor((now - cached.timestamp) / (1000 * 60));
          console.log(`📦 Portfolio History: Using cached data (${ageMinutes}m old, ${cached.data.equity?.length || 0} points)`);
          return NextResponse.json(cached.data);
        }

        // Fetch fresh data
        console.log(`🌐 Portfolio History: Fetching fresh data from Alpaca...`);
        const history = await alpacaRequest('/v2/account/portfolio/history?period=1M&timeframe=1H');

        const responseData = {
          equity: history.equity,
          timestamp: history.timestamp,
        };

        // Cache for 5 minutes
        memoryCache[cacheKey] = { data: responseData, timestamp: now };
        console.log(`✅ Portfolio History: Cached for 5 minutes (${responseData.equity?.length || 0} data points)`);

        return NextResponse.json(responseData);
      }
      
      case 'orders': {
        // Get recent orders from tradingbot account - increased limit to capture all October trades
        const cacheKey = 'alpaca-orders';
        const now = Date.now();

        // Check cache
        const cached = memoryCache[cacheKey];
        if (cached && (now - cached.timestamp) < ALPACA_CACHE_DURATION_MS) {
          const ageMinutes = Math.floor((now - cached.timestamp) / (1000 * 60));
          console.log(`📦 Orders: Using cached data (${ageMinutes}m old, ${cached.data.length} orders)`);
          return NextResponse.json(cached.data);
        }

        // Fetch fresh data
        console.log(`🌐 Orders: Fetching fresh data from Alpaca...`);
        const orders = await alpacaRequest('/v2/orders?status=all&limit=100&direction=desc');

        // Cache for 5 minutes
        memoryCache[cacheKey] = { data: orders, timestamp: now };
        console.log(`✅ Orders: Cached for 5 minutes (${orders.length} orders)`);

        return NextResponse.json(orders);
      }

      case 'spy-bars': {
        // Get SPY historical bars from Alpha Vantage API with in-memory caching
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        if (!start || !end) {
          return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 });
        }

        // Create cache key from date range
        const cacheKey = `spy-bars:${start.split('T')[0]}:${end.split('T')[0]}`;
        console.log(`🔍 SPY Request: ${start.split('T')[0]} to ${end.split('T')[0]}`);

        try {
          // Check in-memory cache
          const cached = memoryCache[cacheKey];
          const now = Date.now();
          if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
            const ageHours = Math.floor((now - cached.timestamp) / (1000 * 60 * 60));
            console.log(`📦 SPY: Using cached data (${ageHours}h old, ${cached.data.bars?.length || 0} bars)`);
            return NextResponse.json(cached.data);
          }

          // Fetch fresh data from Alpha Vantage API
          console.log('🌐 SPY: Fetching fresh data from Alpha Vantage API...');
          const alphaVantageUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=SPY&interval=60min&outputsize=full&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;

          const response = await fetch(alphaVantageUrl);

          if (!response.ok) {
            console.error('Alpha Vantage API error:', response.status, await response.text());
            return NextResponse.json({ bars: null }, { status: 200 });
          }

          const data = await response.json();

          // Alpha Vantage returns: { "Time Series (60min)": { "2024-10-10 15:00:00": { "4. close": "573.45", ... } } }
          const timeSeries = data['Time Series (60min)'];
          if (timeSeries && typeof timeSeries === 'object') {
            const bars = Object.entries(timeSeries)
              .map(([timestamp, values]: [string, any]) => ({
                t: new Date(timestamp).toISOString(),
                c: parseFloat(values['4. close']),
              }))
              .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());

            const responseData = { bars };

            // Cache in memory for 1 week
            memoryCache[cacheKey] = { data: responseData, timestamp: now };
            console.log(`✅ SPY: Fresh data cached (${bars.length} bars, expires in 7 days)`);

            return NextResponse.json(responseData);
          }

          console.log('⚠️ SPY: Alpha Vantage returned no valid data');
          return NextResponse.json({ bars: null });
        } catch (error) {
          console.error('❌ SPY: Fetch error:', error);
          return NextResponse.json({ bars: null }, { status: 200 });
        }
      }

      case 'qqq-bars': {
        // Get QQQ (NASDAQ-100) historical bars from Alpha Vantage API with in-memory caching
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        if (!start || !end) {
          return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 });
        }

        // Create cache key from date range
        const cacheKey = `qqq-bars:${start.split('T')[0]}:${end.split('T')[0]}`;
        console.log(`🔍 QQQ Request: ${start.split('T')[0]} to ${end.split('T')[0]}`);

        try {
          // Check in-memory cache
          const cached = memoryCache[cacheKey];
          const now = Date.now();
          if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
            const ageHours = Math.floor((now - cached.timestamp) / (1000 * 60 * 60));
            console.log(`📦 QQQ: Using cached data (${ageHours}h old, ${cached.data.bars?.length || 0} bars)`);
            return NextResponse.json(cached.data);
          }

          // Fetch fresh data from Alpha Vantage API
          console.log('🌐 QQQ: Fetching fresh data from Alpha Vantage API...');
          const alphaVantageUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=QQQ&interval=60min&outputsize=full&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;

          const response = await fetch(alphaVantageUrl);

          if (!response.ok) {
            console.error('Alpha Vantage API error:', response.status, await response.text());
            return NextResponse.json({ bars: null }, { status: 200 });
          }

          const data = await response.json();

          // Alpha Vantage returns: { "Time Series (60min)": { "2024-10-10 15:00:00": { "4. close": "573.45", ... } } }
          const timeSeries = data['Time Series (60min)'];
          if (timeSeries && typeof timeSeries === 'object') {
            const bars = Object.entries(timeSeries)
              .map(([timestamp, values]: [string, any]) => ({
                t: new Date(timestamp).toISOString(),
                c: parseFloat(values['4. close']),
              }))
              .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());

            const responseData = { bars };

            // Cache in memory for 1 week
            memoryCache[cacheKey] = { data: responseData, timestamp: now };
            console.log(`✅ QQQ: Fresh data cached (${bars.length} bars, expires in 7 days)`);

            return NextResponse.json(responseData);
          }

          console.log('⚠️ QQQ: Alpha Vantage returned no valid data');
          return NextResponse.json({ bars: null });
        } catch (error) {
          console.error('❌ QQQ: Fetch error:', error);
          return NextResponse.json({ bars: null }, { status: 200 });
        }
      }

      case 'stock-bars': {
        // Get any stock's historical bars from Alpha Vantage API with in-memory caching
        const symbol = searchParams.get('symbol');
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        if (!symbol || !start || !end) {
          return NextResponse.json({ error: 'Missing symbol, start, or end date' }, { status: 400 });
        }

        // Create cache key from symbol and date range
        const cacheKey = `stock-bars:${symbol}:${start.split('T')[0]}:${end.split('T')[0]}`;
        console.log(`🔍 ${symbol} Request: ${start.split('T')[0]} to ${end.split('T')[0]}`);

        try {
          // Check in-memory cache
          const cached = memoryCache[cacheKey];
          const now = Date.now();
          if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
            const ageHours = Math.floor((now - cached.timestamp) / (1000 * 60 * 60));
            console.log(`📦 ${symbol}: Using cached data (${ageHours}h old, ${cached.data.bars?.length || 0} bars)`);
            return NextResponse.json(cached.data);
          }

          // Fetch fresh data from Alpha Vantage API
          console.log(`🌐 ${symbol}: Fetching fresh data from Alpha Vantage API...`);
          const alphaVantageUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=60min&outputsize=full&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;

          const response = await fetch(alphaVantageUrl);

          if (!response.ok) {
            console.error(`Alpha Vantage API error for ${symbol}:`, response.status, await response.text());
            return NextResponse.json({ bars: null }, { status: 200 });
          }

          const data = await response.json();

          // Alpha Vantage returns: { "Time Series (60min)": { "2024-10-10 15:00:00": { "4. close": "573.45", ... } } }
          const timeSeries = data['Time Series (60min)'];
          if (timeSeries && typeof timeSeries === 'object') {
            const bars = Object.entries(timeSeries)
              .map(([timestamp, values]: [string, any]) => ({
                t: new Date(timestamp).toISOString(),
                c: parseFloat(values['4. close']),
              }))
              .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());

            const responseData = { bars };

            // Cache in memory for 1 week
            memoryCache[cacheKey] = { data: responseData, timestamp: now };
            console.log(`✅ ${symbol}: Fresh data cached (${bars.length} bars, expires in 7 days)`);

            return NextResponse.json(responseData);
          }

          console.log(`⚠️ ${symbol}: Alpha Vantage returned no valid data`);
          return NextResponse.json({ bars: null });
        } catch (error) {
          console.error(`❌ ${symbol}: Fetch error:`, error);
          return NextResponse.json({ bars: null }, { status: 200 });
        }
      }

      case 'cache-status':
        // Special endpoint to view cache status
        logCacheSummary();
        return NextResponse.json({
          message: 'Cache status logged to console',
          cacheCount: Object.keys(memoryCache).length
        });

      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Alpaca API Error:', error);
    logCacheSummary(); // Show cache status on error
    return NextResponse.json({
      error: 'Failed to fetch data from Alpaca API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
