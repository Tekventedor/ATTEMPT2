import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - replace with actual Alpaca API calls
const mockAccount = {
  portfolio_value: 50000,
  cash: 10000,
  buying_power: 20000,
  equity: 50000,
};

const mockPositions = [
  { symbol: 'AAPL', qty: 10, side: 'long', market_value: 1500, cost_basis: 1450, unrealized_pl: 50, unrealized_plpc: 0.034, current_price: 150 },
  { symbol: 'MSFT', qty: 5, side: 'long', market_value: 1500, cost_basis: 1475, unrealized_pl: 25, unrealized_plpc: 0.017, current_price: 300 },
];

const mockPortfolioHistory = {
  equity: [48000, 48500, 49000, 49500, 50000],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  try {
    switch (endpoint) {
      case 'account':
        return NextResponse.json(mockAccount);
      
      case 'positions':
        return NextResponse.json(mockPositions);
      
      case 'portfolio-history':
        return NextResponse.json(mockPortfolioHistory);
      
      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
