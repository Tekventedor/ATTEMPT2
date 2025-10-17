-- ============================================
-- CREATE TRADING AI AGENT TABLES FROM SCRATCH
-- ============================================
-- Drop old tables if they exist
DROP TABLE IF EXISTS public.course1 CASCADE;
DROP TABLE IF EXISTS public.course2 CASCADE;
DROP TABLE IF EXISTS public.trading_logs CASCADE;
DROP TABLE IF EXISTS public.portfolio_positions CASCADE;

-- Create trading_logs table
CREATE TABLE public.trading_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  action text,
  symbol text,
  quantity numeric,
  price numeric,
  total_value numeric,
  reason text,
  confidence_score numeric,
  market_data jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create portfolio_positions table
CREATE TABLE public.portfolio_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  symbol text,
  quantity numeric,
  average_price numeric,
  current_price numeric,
  total_value numeric,
  unrealized_pnl numeric,
  realized_pnl numeric DEFAULT 0,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now()
);

-- Disable RLS so the API can write
ALTER TABLE public.trading_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_positions DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_trading_logs_symbol ON public.trading_logs(symbol);
CREATE INDEX idx_trading_logs_timestamp ON public.trading_logs(timestamp DESC);
CREATE INDEX idx_portfolio_positions_symbol ON public.portfolio_positions(symbol);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify tables exist
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('trading_logs', 'portfolio_positions')
ORDER BY table_name;
