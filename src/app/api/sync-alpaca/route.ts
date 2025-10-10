import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALPACA_CONFIG = {
  baseUrl: 'https://paper-api.alpaca.markets',
  apiKey: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to fetch from Alpaca
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
    throw new Error(`Alpaca API error: ${response.status}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // 1. Fetch real positions from Alpaca
    const positions = await alpacaRequest('/v2/positions');

    // 2. Clear old positions for this user
    await supabase
      .from('portfolio_positions')
      .delete()
      .eq('user_id', userId);

    // 3. Insert real positions into Supabase
    if (positions.length > 0) {
      const positionsToInsert = positions.map((pos: any) => ({
        user_id: userId,
        symbol: pos.symbol,
        quantity: parseFloat(pos.qty),
        average_price: parseFloat(pos.avg_entry_price),
        current_price: parseFloat(pos.current_price),
        total_value: parseFloat(pos.market_value),
        unrealized_pnl: parseFloat(pos.unrealized_pl),
        realized_pnl: 0,
      }));

      await supabase
        .from('portfolio_positions')
        .insert(positionsToInsert);
    }

    // 4. Fetch real orders from Alpaca
    const orders = await alpacaRequest('/v2/orders?status=all&limit=50&direction=desc');

    // 5. Clear old trading logs for this user
    await supabase
      .from('trading_logs')
      .delete()
      .eq('user_id', userId);

    // 6. Insert real orders into Supabase as trading logs
    if (orders.length > 0) {
      const logsToInsert = orders.map((order: any) => ({
        user_id: userId,
        action: order.side.toUpperCase(),
        symbol: order.symbol,
        quantity: parseFloat(order.qty),
        price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
        total_value: order.filled_avg_price ? parseFloat(order.filled_avg_price) * parseFloat(order.qty) : null,
        reason: `${order.type} ${order.side} order - ${order.status}`,
        confidence_score: order.status === 'filled' ? 1.0 : 0.5,
        market_data: {},
        timestamp: order.submitted_at,
      }));

      await supabase
        .from('trading_logs')
        .insert(logsToInsert);
    }

    // 7. Fetch account info for performance metrics
    const account = await alpacaRequest('/v2/account');

    // 8. Update today's performance metrics
    const today = new Date().toISOString().split('T')[0];

    // Calculate win rate from positions
    const profitablePositions = positions.filter((p: any) => parseFloat(p.unrealized_pl) > 0).length;
    const winRate = positions.length > 0 ? profitablePositions / positions.length : 0;

    await supabase
      .from('performance_metrics')
      .upsert({
        user_id: userId,
        date: today,
        total_portfolio_value: parseFloat(account.portfolio_value),
        daily_pnl: parseFloat(account.equity) - parseFloat(account.last_equity),
        total_pnl: parseFloat(account.equity) - 100000, // Assuming $100k starting capital
        win_rate: winRate,
        sharpe_ratio: null,
        max_drawdown: null,
        total_trades: orders.filter((o: any) => o.status === 'filled').length,
        winning_trades: orders.filter((o: any) => o.status === 'filled' && o.side === 'sell').length,
        losing_trades: orders.filter((o: any) => o.status === 'filled' && o.side === 'sell').length,
      }, {
        onConflict: 'user_id,date'
      });

    return NextResponse.json({
      success: true,
      synced: {
        positions: positions.length,
        orders: orders.length,
        portfolio_value: parseFloat(account.portfolio_value),
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      error: 'Failed to sync Alpaca data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
