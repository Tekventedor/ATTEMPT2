-- Temporarily disable RLS on trading_logs and portfolio_positions so the sync API can insert data
-- This allows the /api/sync-alpaca endpoint to update the tables

ALTER TABLE public.trading_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_positions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('trading_logs', 'portfolio_positions');
