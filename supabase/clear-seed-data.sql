-- Clear all seed/fake data from trading tables
-- Run this before syncing real Alpaca data

-- Clear portfolio positions
DELETE FROM portfolio_positions;

-- Clear trading logs
DELETE FROM trading_logs;

-- Clear performance metrics
DELETE FROM performance_metrics;

-- Verify tables are empty
SELECT 'portfolio_positions' as table_name, COUNT(*) as remaining_rows FROM portfolio_positions
UNION ALL
SELECT 'trading_logs', COUNT(*) FROM trading_logs
UNION ALL
SELECT 'performance_metrics', COUNT(*) FROM performance_metrics;
