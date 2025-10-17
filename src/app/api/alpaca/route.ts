import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Alpaca API configuration for tradingbot account
const ALPACA_CONFIG = {
  baseUrl: 'https://paper-api.alpaca.markets',
  apiKey: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
};

const CACHE_DURATION_SECONDS = 3600; // 1 hour in seconds

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  try {
    switch (endpoint) {
      case 'account':
        // Get account information from tradingbot account
        const account = await alpacaRequest('/v2/account');
        return NextResponse.json({
          portfolio_value: parseFloat(account.portfolio_value),
          cash: parseFloat(account.cash),
          buying_power: parseFloat(account.buying_power),
          equity: parseFloat(account.equity),
          account_number: account.account_number,
          status: account.status,
        });
      
      case 'positions':
        // Get current positions from tradingbot account
        const positions = await alpacaRequest('/v2/positions');
        return NextResponse.json(positions.map((pos: Record<string, unknown>) => ({
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
        })));
      
      case 'portfolio-history':
        // Get portfolio history from tradingbot account - hourly data for detailed chart
        const history = await alpacaRequest('/v2/account/portfolio/history?period=1W&timeframe=1H');
        return NextResponse.json({
          equity: history.equity,
          timestamp: history.timestamp,
        });
      
      case 'orders':
        // Get recent orders from tradingbot account
        const orders = await alpacaRequest('/v2/orders?status=all&limit=50&direction=desc');
        return NextResponse.json(orders);

      case 'spy-bars': {
        // Get SPY historical bars from Twelve Data API with Vercel KV caching
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        if (!start || !end) {
          return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 });
        }

        // Create cache key from date range
        const cacheKey = `spy-bars:${start.split('T')[0]}:${end.split('T')[0]}`;

        try {
          // Try to get cached data from Vercel KV
          const cachedData = await kv.get<{ bars: Array<{ t: string; c: number }> }>(cacheKey);

          if (cachedData) {
            console.log('📦 Returning cached SPY data from Vercel KV');
            return NextResponse.json(cachedData);
          }

          // Fetch fresh data from Twelve Data API
          console.log('🌐 Fetching fresh SPY data from Twelve Data API');
          const twelveDataUrl = `https://api.twelvedata.com/time_series?symbol=SPY&interval=1h&start_date=${start.split('T')[0]}&end_date=${end.split('T')[0]}&apikey=3691150323a643eb828fb7bf156ea0e9&format=JSON`;

          const response = await fetch(twelveDataUrl);

          if (!response.ok) {
            console.error('Twelve Data API error:', response.status, await response.text());
            return NextResponse.json({ bars: null }, { status: 200 });
          }

          const data = await response.json();

          console.log('Twelve Data response:', JSON.stringify(data).substring(0, 500));

          // Twelve Data returns: { values: [{ datetime: "2024-10-10 09:30:00", close: "573.45", ... }] }
          if (data?.values && Array.isArray(data.values) && data.values.length > 0) {
            const bars = data.values.reverse().map((bar: { datetime: string; close: string }) => ({
              t: new Date(bar.datetime).toISOString(),
              c: parseFloat(bar.close),
            }));
            console.log(`Twelve Data: Returning ${bars.length} SPY bars`);

            const responseData = { bars };

            // Cache in Vercel KV with 1 hour expiration
            await kv.set(cacheKey, responseData, { ex: CACHE_DURATION_SECONDS });
            console.log(`✅ Cached SPY data in Vercel KV for 1 hour`);

            return NextResponse.json(responseData);
          }

          console.log('Twelve Data: No valid data returned');
          return NextResponse.json({ bars: null });
        } catch (error) {
          console.error('SPY bars fetch error:', error);
          return NextResponse.json({ bars: null }, { status: 200 });
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('Alpaca API Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch data from Alpaca API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
