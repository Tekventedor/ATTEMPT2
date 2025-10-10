# Trading AI Agent Performance

A comprehensive trading dashboard built with Next.js, Supabase, and Alpaca Paper Trading API to monitor your AI trading agent's performance.

**Supabase Project:** Trading AI Agent Performance

## Features
- **Real-time Portfolio Monitoring** with live P&L tracking
- **Alpaca Paper Trading Integration** for simulated trading data
- **Comprehensive Analytics** including performance metrics and charts
- **Trading Logs** with detailed AI decision tracking
- **Position Management** with real-time market data
- **Modern UI** with Tailwind CSS and responsive design
- **Supabase-powered backend** for data persistence and authentication

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Tekventedor/TradingAIAgentPerformance.git
cd TradingAIAgentPerformance
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Copy `.env.local.example` to `.env.local` and fill in your credentials:
```bash
cp .env.local.example .env.local
```

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ALPACA_API_KEY=your-alpaca-api-key
ALPACA_SECRET_KEY=your-alpaca-secret-key
```

### 4. Set up Supabase Database
Run the migration to create the trading schema:
```bash
supabase db push
```

### 5. Run locally
```bash
npm run dev
```

## Environment Variables
Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ALPACA_API_KEY=your-alpaca-paper-trading-api-key
ALPACA_SECRET_KEY=your-alpaca-paper-trading-secret-key
```

## Database Schema

The application uses the following main tables:
- `trading_logs` - Stores all AI trading decisions and actions
- `portfolio_positions` - Current portfolio positions and P&L
- `performance_metrics` - Daily performance tracking
- `ai_agent_settings` - AI agent configuration

## Features Overview

### Dashboard Components
- **Portfolio Overview**: Real-time portfolio value, cash, and buying power
- **Performance Charts**: Interactive charts showing portfolio performance over time
- **Position Management**: Detailed view of current holdings with P&L
- **Trading Logs**: Complete history of AI trading decisions with confidence scores
- **Analytics**: Win rate, Sharpe ratio, and other performance metrics

### AI Trading Integration
- Connects to Alpaca Paper Trading API for simulated trading
- Tracks AI decision-making process with confidence scores
- Logs all trading actions with detailed reasoning
- Real-time portfolio and position updates

## Deployment (Vercel)
1. Push your code to GitHub.
2. Import the repo in [Vercel](https://vercel.com/).
3. Set the environment variables in the Vercel dashboard.
4. Deploy!

---

### License
MIT
