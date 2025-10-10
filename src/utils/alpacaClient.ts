// Alpaca client will be initialized only on server side
let alpacaClient: any = null;

// Initialize Alpaca client only on server side
if (typeof window === 'undefined') {
  const { AlpacaClient } = require('@alpacahq/alpaca-trade-api');
  
  alpacaClient = new AlpacaClient({
    credentials: {
      key: process.env.ALPACA_API_KEY || '',
      secret: process.env.ALPACA_SECRET_KEY || '',
      paper: true, // Use paper trading by default
    },
    rate_limit: true,
  });
}

// Types for trading data
export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  timestamp: string;
  order_type: string;
  status: string;
}

export interface Position {
  symbol: string;
  qty: number;
  side: 'long' | 'short';
  market_value: number;
  cost_basis: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  current_price: number;
  lastday_price: number;
  change_today: number;
}

export interface Account {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: number;
  regt_buying_power: number;
  daytrading_buying_power: number;
  cash: number;
  portfolio_value: number;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  trade_suspended_by_user: boolean;
  multiplier: string;
  shorting_enabled: boolean;
  equity: number;
  last_equity: number;
  long_market_value: number;
  short_market_value: number;
  initial_margin: number;
  maintenance_margin: number;
  last_maintenance_margin: number;
  sma: number;
  daytrade_count: number;
}

// API functions - only work on server side
export async function getAccount(): Promise<Account | null> {
  if (typeof window !== 'undefined' || !alpacaClient) {
    return null; // Return null on client side
  }
  
  try {
    const account = await alpacaClient.getAccount();
    return account;
  } catch (error) {
    console.error('Error fetching account:', error);
    return null;
  }
}

export async function getPositions(): Promise<Position[]> {
  if (typeof window !== 'undefined' || !alpacaClient) {
    return []; // Return empty array on client side
  }
  
  try {
    const positions = await alpacaClient.getPositions();
    return positions;
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
}

export async function getOrders(limit = 100): Promise<Trade[]> {
  if (typeof window !== 'undefined' || !alpacaClient) {
    return []; // Return empty array on client side
  }
  
  try {
    const orders = await alpacaClient.getOrders({
      status: 'all',
      limit,
      direction: 'desc',
    });
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function getPortfolioHistory(period = '1M'): Promise<any> {
  if (typeof window !== 'undefined' || !alpacaClient) {
    return null; // Return null on client side
  }
  
  try {
    const history = await alpacaClient.getPortfolioHistory({
      period,
      timeframe: '1Day',
    });
    return history;
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    return null;
  }
}

export async function getMarketData(symbols: string[]): Promise<any> {
  if (typeof window !== 'undefined' || !alpacaClient) {
    return null; // Return null on client side
  }
  
  try {
    const snapshot = await alpacaClient.getSnapshots(symbols);
    return snapshot;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}
