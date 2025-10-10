# Trading AI Agent Performance Dashboard

An automated trading dashboard that syncs real-time data from your Alpaca paper trading account to Supabase and displays portfolio performance, positions, and trading activity.

## Features

- 🔄 **Auto-sync** - Fetches real data from Alpaca every 5 minutes
- 📊 **Portfolio Overview** - Real-time portfolio value, P&L, and win rate
- 📈 **Performance Charts** - Portfolio history and position distribution
- 💼 **Position Tracking** - Live positions with current prices and unrealized P&L
- 📝 **Trading Logs** - Complete order history from your Alpaca account
- 🔐 **Secure Authentication** - Supabase auth integration

## Tech Stack

- **Frontend**: Next.js 15 (React 19, TypeScript, Tailwind CSS)
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Trading API**: Alpaca Paper Trading
- **Charts**: Recharts
- **Deployment**: Vercel

## Project Structure

```
TradingAIAgent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── alpaca/route.ts        # Alpaca API proxy
│   │   │   └── sync-alpaca/route.ts   # Sync data from Alpaca to Supabase
│   │   ├── dashboard/page.tsx         # Main dashboard UI
│   │   └── page.tsx                   # Login page
│   └── utils/
│       └── supabaseClient.ts          # Supabase client
├── supabase/
│   ├── migrations/                    # Database migrations
│   ├── INSERT_REAL_ALPACA_DATA.sql   # Manual data insert script
│   └── FIX_RLS_AND_TEST.sql          # RLS configuration
└── package.json
```

## Database Schema

### `trading_logs`
Stores all order history from Alpaca:
- `id`, `title`, `description`
- `action` (BUY/SELL), `symbol`, `quantity`, `price`
- `total_value`, `reason`, `confidence_score`
- `market_data` (jsonb), `tags`, `timestamp`

### `portfolio_positions`
Stores current positions:
- `id`, `title`, `description`
- `symbol`, `quantity`, `average_price`, `current_price`
- `total_value`, `unrealized_pnl`, `realized_pnl`
- `tags`

## Setup

### 1. Environment Variables

Create `.env.local`:

```bash
# Alpaca API (Paper Trading)
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

Run in Supabase SQL Editor:

```sql
-- Rename tables (if migrating from old schema)
ALTER TABLE IF EXISTS public.course1 RENAME TO trading_logs;
ALTER TABLE IF EXISTS public.course2 RENAME TO portfolio_positions;

-- Disable RLS to allow API writes
ALTER TABLE public.trading_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_positions DISABLE ROW LEVEL SECURITY;
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## How Auto-Sync Works

1. **On Dashboard Load**: Automatically fetches latest data from Alpaca
2. **Every 5 Minutes**: Re-syncs data while dashboard is open
3. **Manual Refresh**: Click refresh button for instant sync

### Sync Flow:
```
Alpaca API → Sync Endpoint → Delete Old Rows → Insert Fresh Data → Dashboard Reloads
```

## API Endpoints

### `POST /api/sync-alpaca`
Syncs Alpaca data to Supabase tables.

**Response:**
```json
{
  "success": true,
  "synced": {
    "positions": 3,
    "orders": 5,
    "portfolio_value": 99332.50
  }
}
```

### `GET /api/alpaca?endpoint={endpoint}`
Proxy for Alpaca API calls (used for account data and portfolio history).

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Auto-deploys on every push to `main`.

## Troubleshooting

### Sync Fails with RLS Error
Run the RLS disable SQL in Supabase SQL Editor.

### Dashboard Shows No Data
1. Check browser console for errors
2. Verify Alpaca API keys are correct
3. Click refresh button manually
4. Check Supabase tables have data

### TypeScript Errors
```bash
npm run build
```

## License

MIT

## Contributing

Pull requests welcome! Please ensure:
- TypeScript types are correct
- Code is formatted with Prettier
- Tests pass (if applicable)

---

**Note**: This project uses Alpaca's **paper trading** API. Never use live trading credentials.
