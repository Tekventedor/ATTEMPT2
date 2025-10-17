import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALPACA_CONFIG = {
  baseUrl: 'https://paper-api.alpaca.markets',
  apiKey: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

export async function POST() {
  try {
    console.log('[SYNC] Starting Alpaca sync...');

    // 1. Fetch real positions from Alpaca
    const positions = await alpacaRequest('/v2/positions');
    console.log(`[SYNC] Fetched ${positions.length} positions from Alpaca`);

    // 2. Clear old positions from portfolio_positions
    const { error: deletePositionsError } = await supabase
      .from('portfolio_positions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (deletePositionsError) {
      console.error('[SYNC] Error deleting old positions:', deletePositionsError);
    } else {
      console.log('[SYNC] Cleared old positions from portfolio_positions');
    }

    // 3. Insert real positions into portfolio_positions
    if (positions.length > 0) {
      const positionsToInsert = positions.map((pos: Record<string, unknown>) => ({
        title: `${pos.symbol as string} Position`,
        description: `${pos.qty} shares at $${parseFloat(pos.current_price as string).toFixed(2)}`,
        symbol: pos.symbol as string,
        quantity: parseFloat(pos.qty as string),
        average_price: parseFloat(pos.avg_entry_price as string),
        current_price: parseFloat(pos.current_price as string),
        total_value: parseFloat(pos.market_value as string),
        unrealized_pnl: parseFloat(pos.unrealized_pl as string),
        realized_pnl: 0,
        tags: [pos.side as string, parseFloat(pos.unrealized_pl as string) >= 0 ? 'winning' : 'losing']
      }));

      const { error: insertPositionsError } = await supabase
        .from('portfolio_positions')
        .insert(positionsToInsert);

      if (insertPositionsError) {
        console.error('[SYNC] Error inserting positions:', insertPositionsError);
        throw insertPositionsError;
      }
      console.log(`[SYNC] Inserted ${positionsToInsert.length} positions into portfolio_positions`);
    }

    // 4. Fetch real orders from Alpaca
    const orders = await alpacaRequest('/v2/orders?status=all&limit=50&direction=desc');
    console.log(`[SYNC] Fetched ${orders.length} orders from Alpaca`);

    // 5. Clear old trading logs from trading_logs
    const { error: deleteLogsError } = await supabase
      .from('trading_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (deleteLogsError) {
      console.error('[SYNC] Error deleting old logs:', deleteLogsError);
    } else {
      console.log('[SYNC] Cleared old logs from trading_logs');
    }

    // 6. Insert real orders into trading_logs
    if (orders.length > 0) {
      const logsToInsert = orders.map((order: Record<string, unknown>) => ({
        title: `${order.symbol as string} ${(order.side as string).toUpperCase()} Order`,
        description: `${order.type as string} order - ${order.status as string}`,
        action: (order.side as string).toUpperCase(),
        symbol: order.symbol as string,
        quantity: parseFloat(order.qty as string),
        price: order.filled_avg_price ? parseFloat(order.filled_avg_price as string) : null,
        total_value: order.filled_avg_price ? parseFloat(order.filled_avg_price as string) * parseFloat(order.qty as string) : null,
        reason: `${order.type as string} ${order.side as string} order - ${order.status as string}`,
        confidence_score: order.status === 'filled' ? 1.0 : 0.5,
        market_data: { order_type: order.type, time_in_force: order.time_in_force },
        tags: [order.side as string, order.status as string],
        timestamp: order.submitted_at as string,
      }));

      const { error: insertLogsError } = await supabase
        .from('trading_logs')
        .insert(logsToInsert);

      if (insertLogsError) {
        console.error('[SYNC] Error inserting logs:', insertLogsError);
        throw insertLogsError;
      }
      console.log(`[SYNC] Inserted ${logsToInsert.length} orders into trading_logs`);
    }

    // 7. Fetch account info
    const account = await alpacaRequest('/v2/account');
    console.log(`[SYNC] Account value: $${account.portfolio_value}`);

    console.log('[SYNC] Sync completed successfully!');

    return NextResponse.json({
      success: true,
      synced: {
        positions: positions.length,
        orders: orders.length,
        portfolio_value: parseFloat(account.portfolio_value),
      }
    });

  } catch (error) {
    console.error('[SYNC] Sync failed:', error);
    return NextResponse.json({
      error: 'Failed to sync Alpaca data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Allow GET requests too for easier testing
export async function GET() {
  return POST();
}
