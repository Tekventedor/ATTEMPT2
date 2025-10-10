-- ============================================
-- FIX RLS AND VERIFY IT WORKS
-- ============================================
-- Run this entire script in Supabase SQL Editor

-- 1. Disable RLS on both tables
ALTER TABLE public.trading_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_positions DISABLE ROW LEVEL SECURITY;

-- 2. Verify RLS is disabled (should show 'f' for false)
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('trading_logs', 'portfolio_positions');

-- Expected output:
-- schemaname | tablename            | rls_enabled
-- -----------+----------------------+-------------
-- public     | trading_logs         | f
-- public     | portfolio_positions  | f

-- 3. Test inserting data (should succeed)
INSERT INTO public.portfolio_positions (title, description, symbol, quantity, average_price, current_price, total_value, unrealized_pnl, tags)
VALUES ('TEST Position', 'Test insert', 'TEST', 1, 100, 101, 101, 1, ARRAY['test'])
RETURNING id, title, symbol;

-- 4. Clean up test data
DELETE FROM public.portfolio_positions WHERE symbol = 'TEST';

-- 5. Show current data
SELECT 'trading_logs rows:' as info, COUNT(*) as count FROM public.trading_logs
UNION ALL
SELECT 'portfolio_positions rows:', COUNT(*) FROM public.portfolio_positions;

-- ============================================
-- If you see ANY errors, copy them and show them
-- If everything works, you'll see the TEST position created and then deleted
-- ============================================
