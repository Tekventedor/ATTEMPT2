# Alpaca Data Sync Setup Guide

This guide explains how to sync real trading data from Alpaca into your Supabase database and display it on your dashboard.

## How It Works

1. **Alpaca API** → Fetch real trading data (positions, orders, account info)
2. **Sync Function** → Store data in Supabase tables
3. **Dashboard** → Read and display data from Supabase

## Setup Steps

### 1. Configure Environment Variables

Add your Alpaca API credentials to `.env.local`:

```bash
# Alpaca API (Paper Trading)
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key

# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Get Alpaca API Keys

1. Go to [Alpaca's website](https://alpaca.markets/)
2. Sign up for a free paper trading account
3. Navigate to your dashboard → API Keys
4. Generate new API keys (make sure it's for **Paper Trading**)
5. Copy the API Key and Secret Key to your `.env.local`

### 3. Clear Fake Seed Data

Before syncing real data, clear the fake seed data from your Supabase tables:

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase/clear-seed-data.sql`

**Option B: Using Supabase CLI**
```bash
cd ATTEMPT2
supabase db reset  # This will reset and re-run migrations (optional)
# OR just run the clear script:
psql -h your_db_host -U postgres -d postgres -f supabase/clear-seed-data.sql
```

### 4. Sync Alpaca Data

The sync happens automatically when you click the **Refresh button** in the dashboard.

The sync process:
1. Fetches positions from Alpaca
2. Deletes old positions for the user
3. Inserts new positions into `portfolio_positions` table
4. Fetches recent orders from Alpaca
5. Deletes old trading logs for the user
6. Inserts orders as trading logs into `trading_logs` table
7. Updates performance metrics in `performance_metrics` table

## Using the Dashboard

### Initial Load
- Dashboard loads data from Supabase tables
- If tables are empty, you'll see "No positions found" and "No trading activity found"

### Syncing Data
1. Click the **Refresh button** (circular arrow icon) in the top right
2. This triggers the sync API which:
   - Fetches latest data from Alpaca
   - Updates Supabase tables
   - Reloads the dashboard

### What You'll See
- **Portfolio Value**: Total value of your Alpaca account
- **Unrealized P&L**: Profit/loss on current positions
- **Cash Available**: Available cash in your account
- **Win Rate**: Percentage of profitable positions
- **Portfolio Performance Chart**: Historical portfolio value
- **Positions Distribution**: Pie chart of your holdings
- **Current Positions Table**: All open positions with P&L
- **Recent Trading Activity**: Last 50 orders/trades

## Database Tables

### `portfolio_positions`
Stores current open positions from Alpaca:
- `symbol`, `quantity`, `average_price`, `current_price`
- `total_value`, `unrealized_pnl`, `realized_pnl`

### `trading_logs`
Stores order history from Alpaca:
- `action` (BUY/SELL), `symbol`, `quantity`, `price`
- `reason`, `confidence_score`, `timestamp`

### `performance_metrics`
Stores daily performance snapshots:
- `total_portfolio_value`, `daily_pnl`, `total_pnl`
- `win_rate`, `total_trades`, `winning_trades`, `losing_trades`

## API Endpoints

### POST `/api/sync-alpaca`
Syncs data from Alpaca to Supabase.

**Request:**
```json
{
  "userId": "user-uuid-from-supabase-auth"
}
```

**Response:**
```json
{
  "success": true,
  "synced": {
    "positions": 5,
    "orders": 23,
    "portfolio_value": 105234.56
  }
}
```

## Troubleshooting

### Dashboard shows "No positions found"
1. Make sure you have positions in your Alpaca paper trading account
2. Click the Refresh button to sync data
3. Check browser console for errors

### Sync fails with 401 error
- Check that your Alpaca API keys are correct in `.env.local`
- Verify you're using **Paper Trading** keys, not Live Trading
- Restart your Next.js dev server after changing `.env.local`

### Data not updating
- Click the Refresh button manually
- Check that the sync API route is accessible at `/api/sync-alpaca`
- Verify Supabase connection is working

### TypeScript errors
Run `npm run build` to check for type errors. Common issues:
- Missing fields in database tables
- Type mismatches between Alpaca API response and our interfaces

## Development

### Running locally
```bash
cd ATTEMPT2
npm install
npm run dev
```

### Database migrations
```bash
supabase migration list
supabase migration new migration_name
supabase db push
```

### Testing sync manually
```bash
# Get your user ID from Supabase Auth dashboard
curl -X POST http://localhost:3000/api/sync-alpaca \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id-here"}'
```

## Next Steps

- [ ] Add automatic sync on dashboard load (optional)
- [ ] Add sync interval (e.g., every 5 minutes)
- [ ] Store account cash/buying_power separately
- [ ] Add error notifications in the UI
- [ ] Add loading states during sync
- [ ] Implement real-time updates with Supabase subscriptions

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs (terminal running `npm run dev`)
3. Verify your Alpaca account has actual trades/positions
4. Make sure all environment variables are set correctly
