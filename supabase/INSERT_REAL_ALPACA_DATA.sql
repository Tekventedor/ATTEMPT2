-- ============================================
-- REAL DATA FROM YOUR ALPACA PAPER TRADING ACCOUNT
-- Fetched: 2025-10-10
-- Account: PA3DRRJ0FDJN
-- Portfolio Value: $99,332.50
-- ============================================

-- Clear existing fake data
DELETE FROM public.trading_logs;
DELETE FROM public.portfolio_positions;

-- ============================================
-- YOUR REAL POSITIONS (portfolio_positions)
-- ============================================

-- Position 1: AUST (Aurora Technology Acquisition Corp)
-- 2000 shares @ $2.38 avg, currently $2.28
-- LOSING $200 (-4.2%)
INSERT INTO public.portfolio_positions (title, description, symbol, quantity, average_price, current_price, total_value, unrealized_pnl, tags) VALUES
('AUST Position', 'Aurora Technology Acquisition - down 4.2%', 'AUST', 2000, 2.38, 2.28, 4560.00, -200.00, ARRAY['spac', 'losing']);

-- Position 2: CDE (Coeur Mining Inc)
-- 475 shares @ $19.92 avg, currently $19.50
-- LOSING $199.50 (-2.1%)
INSERT INTO public.portfolio_positions (title, description, symbol, quantity, average_price, current_price, total_value, unrealized_pnl, tags) VALUES
('CDE Position', 'Coeur Mining - down 2.1%', 'CDE', 475, 19.92, 19.50, 9262.50, -199.50, ARRAY['mining', 'commodity', 'losing']);

-- Position 3: LMND (Lemonade Inc)
-- 100 shares @ $50.88 avg, currently $48.20
-- LOSING $268 (-5.3%)
INSERT INTO public.portfolio_positions (title, description, symbol, quantity, average_price, current_price, total_value, unrealized_pnl, tags) VALUES
('LMND Position', 'Lemonade Insurance - down 5.3%', 'LMND', 100, 50.88, 48.20, 4820.00, -268.00, ARRAY['insurance', 'tech', 'losing']);

-- ============================================
-- YOUR REAL ORDER HISTORY (trading_logs)
-- ============================================

-- Order 1: LMND Buy (Most Recent)
-- Filled: 2025-10-10 at 14:46:08 UTC
-- 100 shares @ $50.88
INSERT INTO public.trading_logs (title, description, action, symbol, quantity, price, total_value, reason, confidence_score, market_data, tags, timestamp) VALUES
('LMND Buy Order', 'Bought 100 shares of Lemonade', 'BUY', 'LMND', 100, 50.88, 5088.00, 'Market buy order executed', 1.0, '{"order_type": "market", "time_in_force": "day"}', ARRAY['buy', 'insurance', 'tech'], '2025-10-10 14:46:08+00');

-- Order 2: CDE Buy
-- Filled: 2025-10-10 at 14:43:29 UTC
-- 475 shares @ $19.92
INSERT INTO public.trading_logs (title, description, action, symbol, quantity, price, total_value, reason, confidence_score, market_data, tags, timestamp) VALUES
('CDE Buy Order', 'Bought 475 shares of Coeur Mining', 'BUY', 'CDE', 475, 19.92, 9462.00, 'Market buy order executed', 1.0, '{"order_type": "market", "time_in_force": "day"}', ARRAY['buy', 'mining', 'commodity'], '2025-10-10 14:43:29+00');

-- Order 3: AUST Buy (First Order)
-- Filled: 2025-10-10 at 14:41:59 UTC
-- 2000 shares @ $2.38
INSERT INTO public.trading_logs (title, description, action, symbol, quantity, price, total_value, reason, confidence_score, market_data, tags, timestamp) VALUES
('AUST Buy Order', 'Bought 2000 shares of Aurora Technology', 'BUY', 'AUST', 2000, 2.38, 4760.00, 'Market buy order executed', 1.0, '{"order_type": "market", "time_in_force": "day"}', ARRAY['buy', 'spac'], '2025-10-10 14:41:59+00');

-- ============================================
-- VERIFY YOUR DATA
-- ============================================
SELECT 'Trading Logs' as table_name, COUNT(*) as rows FROM public.trading_logs
UNION ALL
SELECT 'Portfolio Positions', COUNT(*) FROM public.portfolio_positions;

SELECT 'Total Portfolio Value' as metric, SUM(total_value) as value FROM public.portfolio_positions;
SELECT 'Total Unrealized P&L' as metric, SUM(unrealized_pnl) as value FROM public.portfolio_positions;

-- View all positions
SELECT symbol, quantity, average_price, current_price, total_value, unrealized_pnl
FROM public.portfolio_positions
ORDER BY unrealized_pnl DESC;

-- View all orders
SELECT action, symbol, quantity, price, total_value, timestamp
FROM public.trading_logs
ORDER BY timestamp DESC;

-- ============================================
-- SUMMARY OF YOUR ACCOUNT
-- ============================================
/*
Account Number: PA3DRRJ0FDJN
Portfolio Value: $99,332.50
Cash: $80,690.00
Buying Power: $175,462.50

POSITIONS (All losing currently):
1. AUST: 2000 shares, -$200 (-4.2%)
2. CDE: 475 shares, -$199.50 (-2.1%)
3. LMND: 100 shares, -$268 (-5.3%)

Total Unrealized Loss: -$667.50

All orders were market buys executed today (Oct 10, 2025)
*/
