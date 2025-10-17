# Flowhunt AI Trading Bot Dashboard

A public-facing trading dashboard that displays real-time data from an Alpaca paper trading account. Shows portfolio performance, stock positions, and trading activity with AI-powered insights.

## Features

- 🤖 **AI Trading Bot** - Automated trading with Flowhunt AI integration
- 📊 **Real-Time Portfolio** - Live portfolio value, profit/loss, and market exposure
- 📈 **Stock Performance Charts** - Multi-stock performance visualization with color-coded lines
- 💼 **Position Tracking** - Current holdings with live prices and unrealized P&L
- 📝 **Activity Log** - Complete order history with compact view
- 🔄 **Auto-Refresh** - Fetches real data from Alpaca every 5 minutes
- 🌐 **Public Access** - No authentication required, viewable by anyone

## Tech Stack

- **Frontend**: Next.js 15 (React 19, TypeScript, Tailwind CSS)
- **Trading API**: Alpaca Paper Trading API
- **Charts**: Recharts
- **Deployment**: Vercel
- **Icons**: Lucide React

## Project Structure

```
TradingAIAgent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── alpaca/route.ts        # Alpaca API proxy
│   │   ├── dashboard/page.tsx         # Main dashboard UI (public)
│   │   └── page.tsx                   # Landing page (redirects to dashboard)
├── public/
│   └── flowhunt-logo.svg              # Flowhunt branding
└── package.json
```

## Dashboard Sections

### 1. **Overview Cards**
- Total Balance (Cash + holdings)
- Current Profit/Loss (percentage display)
- Market Exposure (% invested vs cash)
- Available to Invest (uninvested cash)

### 2. **Stock Performance Chart** (60% width)
- Multi-line chart showing individual stock performance
- Y-axis range: $3K - $15K
- Color-coded by stock ticker
- Shows real-time P&L percentage for each position

### 3. **Activity Log** (40% width)
- Compact trading history (up to 20 items)
- BUY/SELL indicators with color coding
- Price, quantity, and total value per trade

### 4. **Portfolio Value Chart**
- Historical portfolio value over time
- Max/Min/Avg legend
- Y-axis range: $90K - $110K

### 5. **Agent Distribution**
- Pie chart showing position allocation
- Color-coded by stock ticker

### 6. **Current Positions Table**
- Stock ticker symbols
- Shares, avg buy price, current price
- Total value and profit/loss ($ + %)

## Setup

### 1. Environment Variables

Create `.env.local`:

```bash
# Alpaca API (Paper Trading)
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
```

### 2. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 - redirects to `/dashboard`

## How It Works

1. **Landing Page**: Automatically redirects to `/dashboard`
2. **Data Fetching**: Dashboard fetches data directly from Alpaca API
3. **Auto-Refresh**: Re-syncs every 5 minutes automatically
4. **No Authentication**: Publicly accessible, no login required

### Data Flow:
```
Alpaca API → /api/alpaca proxy → Dashboard → Display
```

## API Endpoints

### `GET /api/alpaca?endpoint={endpoint}`
Proxy for Alpaca API calls.

**Examples:**
- `/api/alpaca?endpoint=account` - Get account info
- `/api/alpaca?endpoint=positions` - Get current positions
- `/api/alpaca?endpoint=orders` - Get order history
- `/api/alpaca?endpoint=portfolio/history?period=1M&timeframe=1H` - Portfolio history

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
3. Add environment variables:
   - `ALPACA_API_KEY`
   - `ALPACA_SECRET_KEY`
4. Deploy

**Custom Domain:**
- Go to Vercel Dashboard → Settings → Domains
- Add custom domain or rename project for cleaner URL
- Example: `flowhunt-ai-trading.vercel.app`

Auto-deploys on every push to `main`.

## Features Disabled

The following features are currently disabled:

- **Manual Refresh Button** - Commented out (auto-refresh still works)
- **AI Decision Timeline** - Hidden with CSS class

## Color Palette

10 unique colors for stock positions:
- `#8b5cf6` (Purple)
- `#22d3ee` (Cyan)
- `#f59e0b` (Amber)
- `#10b981` (Green)
- `#ef4444` (Red)
- `#ec4899` (Pink)
- `#6366f1` (Indigo)
- `#14b8a6` (Teal)
- `#f97316` (Orange)
- `#a855f7` (Violet)

## Troubleshooting

### Dashboard Shows No Data
1. Check browser console for errors
2. Verify Alpaca API keys are correct in `.env.local`
3. Ensure Alpaca account has positions/orders
4. Check API rate limits

### TypeScript Errors
```bash
npm run build
```

### Chart Not Displaying Properly
- Check that `portfolioHistory` has data
- Verify Y-axis domain matches your portfolio value range

## License

MIT

## Contributing

Pull requests welcome! Please ensure:
- TypeScript types are correct
- Code is formatted with Prettier
- UI changes are responsive

---

**Note**: This project uses Alpaca's **paper trading** API. Never use live trading credentials.

**Branding**: Powered by Flowhunt AI
