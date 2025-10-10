import { NextRequest, NextResponse } from 'next/server';

// Alpaca API configuration for tradingbot account
const ALPACA_CONFIG = {
  baseUrl: 'https://paper-api.alpaca.markets',
  apiKey: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
};

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
        // Get portfolio history from tradingbot account
        const history = await alpacaRequest('/v2/account/portfolio/history?period=1M&timeframe=1D');
        return NextResponse.json({
          equity: history.equity,
          timestamp: history.timestamp,
        });
      
      case 'orders':
        // Get recent orders from tradingbot account
        const orders = await alpacaRequest('/v2/orders?status=all&limit=50&direction=desc');
        return NextResponse.json(orders);
      
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
