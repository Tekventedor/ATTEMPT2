-- ============================================
-- MANUAL UPDATE SCRIPT FOR TRADING DASHBOARD
-- ============================================
-- Copy and paste sections of this into Supabase SQL Editor
-- to manually adjust your trading data

-- ============================================
-- SECTION 1: CLEAR ALL EXISTING DATA
-- ============================================
-- Run this first to start fresh
DELETE FROM public.course1;
DELETE FROM public.course2;

-- ============================================
-- SECTION 2: ADD YOUR TRADING LOGS (course1)
-- ============================================
-- Edit the values below to match your actual trades
-- Fields: title, description, action, symbol, quantity, price, total_value, reason, confidence_score, market_data, tags

INSERT INTO public.course1 (title, description, action, symbol, quantity, price, total_value, reason, confidence_score, market_data, tags) VALUES
-- Example 1: BUY order
('TSLA Buy Order', 'Tesla purchase based on AI developments', 'BUY', 'TSLA', 10, 250.00, 2500.00, 'Strong AI product roadmap', 0.90, '{"rsi": 45}', ARRAY['buy', 'tech']),

-- Example 2: SELL order
('AAPL Sell Order', 'Taking profits on Apple', 'SELL', 'AAPL', 5, 180.00, 900.00, 'Profit taking at resistance', 0.85, '{"rsi": 70}', ARRAY['sell', 'profit']);

-- Add more rows by copying the line above and changing the values
-- Make sure to add a comma after each row except the last one

-- ============================================
-- SECTION 3: ADD YOUR POSITIONS (course2)
-- ============================================
-- Edit the values below to match your actual portfolio
-- Fields: title, description, symbol, quantity, average_price, current_price, total_value, unrealized_pnl, tags

INSERT INTO public.course2 (title, description, symbol, quantity, average_price, current_price, total_value, unrealized_pnl, tags) VALUES
-- Example 1: Profitable position
('Tesla Position', 'Current Tesla holdings', 'TSLA', 10, 250.00, 260.00, 2600.00, 100.00, ARRAY['tech', 'ev']),

-- Example 2: Losing position
('Apple Position', 'Current Apple holdings', 'AAPL', 5, 180.00, 175.00, 875.00, -25.00, ARRAY['tech']);

-- Add more rows by copying the line above and changing the values
-- Make sure to add a comma after each row except the last one

-- ============================================
-- SECTION 4: VERIFY YOUR DATA
-- ============================================
-- Run these queries to see your data

SELECT * FROM public.course1 ORDER BY created_at DESC;
SELECT * FROM public.course2;

-- ============================================
-- SECTION 5: UPDATE INDIVIDUAL ROWS
-- ============================================
-- To update a specific row, first find its ID:
SELECT id, symbol, quantity, price FROM public.course1;

-- Then update it:
-- UPDATE public.course1
-- SET quantity = 20, price = 255.00, total_value = 5100.00
-- WHERE id = 'paste-id-here';

-- ============================================
-- SECTION 6: DELETE SPECIFIC ROWS
-- ============================================
-- To delete a specific row:
-- DELETE FROM public.course1 WHERE id = 'paste-id-here';
-- DELETE FROM public.course2 WHERE symbol = 'AAPL';

-- ============================================
-- QUICK REFERENCE: Field Descriptions
-- ============================================
/*
course1 (Trading Logs):
- title: Short description like "AAPL Buy Order"
- description: Longer explanation
- action: Must be 'BUY', 'SELL', 'HOLD', or 'ANALYSIS'
- symbol: Stock ticker like 'AAPL', 'TSLA', etc.
- quantity: Number of shares
- price: Price per share
- total_value: quantity × price
- reason: Why you made this trade
- confidence_score: 0 to 1 (e.g., 0.85 = 85% confident)
- market_data: JSON data like '{"rsi": 45}'
- tags: Array like ARRAY['buy', 'tech']

course2 (Portfolio Positions):
- title: Position name like "Apple Position"
- description: Description of the position
- symbol: Stock ticker
- quantity: Number of shares you own
- average_price: What you paid on average
- current_price: Current market price
- total_value: quantity × current_price
- unrealized_pnl: (current_price - average_price) × quantity
- tags: Array like ARRAY['tech', 'long']
*/
