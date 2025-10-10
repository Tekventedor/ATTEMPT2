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
        return NextResponse.json(positions.map((pos: any) => ({
          symbol: pos.symbol,
          qty: parseFloat(pos.qty),
          side: pos.side,
          market_value: parseFloat(pos.market_value),
          cost_basis: parseFloat(pos.cost_basis),
          unrealized_pl: parseFloat(pos.unrealized_pl),
          unrealized_plpc: parseFloat(pos.unrealized_plpc),
          current_price: parseFloat(pos.current_price),
        })));
      
      case 'portfolio-history':
        // Get portfolio history from tradingbot account
        const history = await alpacaRequest('/v2/account/portfolio/history?period=1M&timeframe=1Day');
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
    
    // Return mock data if API fails (for development)
    const mockData = {
      account: {
        portfolio_value: 50000,
        cash: 10000,
        buying_power: 20000,
        equity: 50000,
        account_number: 'tradingbot',
        status: 'ACTIVE',
      },
      positions: [],
      'portfolio-history': {
        equity: [48000, 48500, 49000, 49500, 50000],
        timestamp: [],
      },
      orders: [],
    };
    
    if (endpoint && mockData[endpoint as keyof typeof mockData]) {
      return NextResponse.json(mockData[endpoint as keyof typeof mockData]);
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
