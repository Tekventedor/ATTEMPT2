-- ============================================
-- RENAME TABLES TO TRADING AI AGENT THEME
-- ============================================
-- Changes:
-- course1 → trading_logs
-- course2 → portfolio_positions

-- 1. Rename the tables
ALTER TABLE IF EXISTS public.course1 RENAME TO trading_logs;
ALTER TABLE IF EXISTS public.course2 RENAME TO portfolio_positions;

-- 2. Disable RLS on the renamed tables
ALTER TABLE public.trading_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_positions DISABLE ROW LEVEL SECURITY;

-- 3. Update any existing indexes
-- Rename index on course1 if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'course1_pkey') THEN
        ALTER INDEX course1_pkey RENAME TO trading_logs_pkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'course2_pkey') THEN
        ALTER INDEX course2_pkey RENAME TO portfolio_positions_pkey;
    END IF;
END $$;

-- 4. Verify the rename worked
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('trading_logs', 'portfolio_positions')
ORDER BY tablename;

-- Expected output:
-- tablename            | rls_enabled
-- ---------------------+-------------
-- portfolio_positions  | f
-- trading_logs         | f

-- 5. Show table structure
\d trading_logs
\d portfolio_positions
