-- Sample trading data for testing the dashboard
-- This script inserts sample data to demonstrate the trading dashboard functionality

-- Insert sample trading logs
INSERT INTO public.trading_logs (user_id, action, symbol, quantity, price, total_value, reason, confidence_score, market_data) VALUES
-- Sample BUY orders
(gen_random_uuid(), 'BUY', 'AAPL', 10, 150.25, 1502.50, 'Strong earnings report and positive technical indicators', 0.85, '{"rsi": 45, "macd": "bullish", "volume": 50000000}'),
(gen_random_uuid(), 'BUY', 'MSFT', 5, 300.75, 1503.75, 'Cloud growth accelerating, AI integration expanding', 0.92, '{"rsi": 38, "macd": "bullish", "volume": 30000000}'),
(gen_random_uuid(), 'BUY', 'GOOGL', 8, 120.50, 964.00, 'Search revenue recovery and YouTube growth', 0.78, '{"rsi": 42, "macd": "neutral", "volume": 25000000}'),

-- Sample SELL orders
(gen_random_uuid(), 'SELL', 'AAPL', 5, 155.80, 779.00, 'Taking profits after 3.7% gain, market showing resistance', 0.88, '{"rsi": 65, "macd": "bearish", "volume": 45000000}'),
(gen_random_uuid(), 'SELL', 'TSLA', 3, 180.25, 540.75, 'Volatility concerns, reducing position size', 0.75, '{"rsi": 72, "macd": "bearish", "volume": 80000000}'),

-- Sample HOLD decisions
(gen_random_uuid(), 'HOLD', 'NVDA', 0, 450.00, 0, 'AI chip demand remains strong, holding for long-term growth', 0.90, '{"rsi": 55, "macd": "bullish", "volume": 60000000}'),
(gen_random_uuid(), 'HOLD', 'AMZN', 0, 130.25, 0, 'E-commerce recovery and AWS growth continue', 0.82, '{"rsi": 48, "macd": "neutral", "volume": 40000000}'),

-- Sample ANALYSIS actions
(gen_random_uuid(), 'ANALYSIS', 'SPY', 0, 420.50, 0, 'Market analysis: Bullish trend continues with strong volume', 0.95, '{"rsi": 58, "macd": "bullish", "volume": 100000000}'),
(gen_random_uuid(), 'ANALYSIS', 'QQQ', 0, 380.75, 0, 'Tech sector showing resilience despite market volatility', 0.87, '{"rsi": 52, "macd": "neutral", "volume": 75000000}');

-- Insert sample portfolio positions
INSERT INTO public.portfolio_positions (user_id, symbol, quantity, average_price, current_price, total_value, unrealized_pnl, realized_pnl) VALUES
(gen_random_uuid(), 'AAPL', 5, 150.25, 155.80, 779.00, 27.75, 0),
(gen_random_uuid(), 'MSFT', 5, 300.75, 305.20, 1526.00, 22.25, 0),
(gen_random_uuid(), 'GOOGL', 8, 120.50, 122.15, 977.20, 13.20, 0),
(gen_random_uuid(), 'NVDA', 2, 450.00, 465.30, 930.60, 30.60, 0),
(gen_random_uuid(), 'AMZN', 3, 130.25, 128.90, 386.70, -4.05, 0);

-- Insert sample performance metrics
INSERT INTO public.performance_metrics (user_id, date, total_portfolio_value, daily_pnl, total_pnl, win_rate, sharpe_ratio, max_drawdown, total_trades, winning_trades, losing_trades) VALUES
(gen_random_uuid(), CURRENT_DATE - INTERVAL '7 days', 45000.00, 250.00, 2500.00, 0.65, 1.25, -0.08, 20, 13, 7),
(gen_random_uuid(), CURRENT_DATE - INTERVAL '6 days', 45250.00, 300.00, 2800.00, 0.68, 1.30, -0.07, 22, 15, 7),
(gen_random_uuid(), CURRENT_DATE - INTERVAL '5 days', 45550.00, -150.00, 2650.00, 0.65, 1.22, -0.08, 24, 16, 8),
(gen_random_uuid(), CURRENT_DATE - INTERVAL '4 days', 45400.00, 200.00, 2850.00, 0.67, 1.28, -0.07, 26, 17, 9),
(gen_random_uuid(), CURRENT_DATE - INTERVAL '3 days', 45600.00, 400.00, 3250.00, 0.69, 1.35, -0.06, 28, 19, 9),
(gen_random_uuid(), CURRENT_DATE - INTERVAL '2 days', 46000.00, 350.00, 3600.00, 0.70, 1.38, -0.05, 30, 21, 9),
(gen_random_uuid(), CURRENT_DATE - INTERVAL '1 day', 46350.00, 180.00, 3780.00, 0.71, 1.40, -0.05, 32, 23, 9),
(gen_random_uuid(), CURRENT_DATE, 46530.00, 90.00, 3870.00, 0.72, 1.42, -0.04, 34, 24, 10);

-- Insert sample AI agent settings
INSERT INTO public.ai_agent_settings (user_id, is_active, trading_mode, risk_level, max_position_size, stop_loss_percentage, take_profit_percentage, trading_hours) VALUES
(gen_random_uuid(), true, 'paper', 'medium', 10000.00, 0.05, 0.10, '{"start": "09:30", "end": "16:00", "timezone": "America/New_York"}');
