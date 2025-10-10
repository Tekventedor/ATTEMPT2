# AI Trading Dashboard

A comprehensive Next.js application for monitoring AI trading agent performance using Alpaca Paper Trading API and Supabase.

## Project Structure

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Supabase for data persistence and authentication
- **Trading API**: Alpaca Paper Trading API for simulated trading data
- **Charts**: Recharts for interactive data visualization
- **Icons**: Lucide React for modern UI icons

## Key Features

- Real-time portfolio monitoring
- Trading activity logs with AI decision tracking
- Interactive performance charts
- Position management dashboard
- Confidence score visualization
- Responsive design for all devices

## Database Schema

- `course1` table: Stores trading logs and AI decisions
- `course2` table: Stores portfolio positions and holdings
- Uses existing Supabase authentication and RLS policies

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ALPACA_API_KEY=your-alpaca-paper-api-key
ALPACA_SECRET_KEY=your-alpaca-paper-secret-key
```

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables in `.env.local`
3. Run database migration in Supabase dashboard
4. Start development server: `npm run dev`

## Deployment

Ready for Vercel deployment with environment variables configured in dashboard.
