-- AI Trading Dashboard Schema
-- Converts existing course tables to store trading data

-- First, let's add trading-specific columns to course1
ALTER TABLE public.course1 
ADD COLUMN IF NOT EXISTS action text,
ADD COLUMN IF NOT EXISTS symbol text,
ADD COLUMN IF NOT EXISTS quantity numeric,
ADD COLUMN IF NOT EXISTS price numeric,
ADD COLUMN IF NOT EXISTS total_value numeric,
ADD COLUMN IF NOT EXISTS reason text,
ADD COLUMN IF NOT EXISTS confidence_score numeric,
ADD COLUMN IF NOT EXISTS market_data jsonb,
ADD COLUMN IF NOT EXISTS timestamp timestamptz DEFAULT now();

-- Update the title to be more trading-focused
UPDATE public.course1 SET title = 'Trading Log Entry' WHERE title IS NOT NULL;

-- Insert some sample trading data into course1
INSERT INTO public.course1 (title, description, action, symbol, quantity, price, total_value, reason, confidence_score, market_data, tags) VALUES
('AAPL Buy Order', 'Strong earnings report and positive technical indicators', 'BUY', 'AAPL', 10, 150.25, 1502.50, 'Strong earnings report and positive technical indicators', 0.85, '{"rsi": 45, "macd": "bullish", "volume": 50000000}', ARRAY['buy', 'tech', 'high-confidence']),
('MSFT Buy Order', 'Cloud growth accelerating, AI integration expanding', 'BUY', 'MSFT', 5, 300.75, 1503.75, 'Cloud growth accelerating, AI integration expanding', 0.92, '{"rsi": 38, "macd": "bullish", "volume": 30000000}', ARRAY['buy', 'cloud', 'ai']),
('AAPL Sell Order', 'Taking profits after 3.7% gain, market showing resistance', 'SELL', 'AAPL', 5, 155.80, 779.00, 'Taking profits after 3.7% gain, market showing resistance', 0.88, '{"rsi": 65, "macd": "bearish", "volume": 45000000}', ARRAY['sell', 'profit-taking']),
('NVDA Hold Decision', 'AI chip demand remains strong, holding for long-term growth', 'HOLD', 'NVDA', 0, 450.00, 0, 'AI chip demand remains strong, holding for long-term growth', 0.90, '{"rsi": 55, "macd": "bullish", "volume": 60000000}', ARRAY['hold', 'ai', 'long-term']),
('Market Analysis', 'Market analysis: Bullish trend continues with strong volume', 'ANALYSIS', 'SPY', 0, 420.50, 0, 'Market analysis: Bullish trend continues with strong volume', 0.95, '{"rsi": 58, "macd": "bullish", "volume": 100000000}', ARRAY['analysis', 'market', 'bullish']);

-- Modify course2 to store portfolio positions
ALTER TABLE public.course2 
ADD COLUMN IF NOT EXISTS symbol text,
ADD COLUMN IF NOT EXISTS quantity numeric,
ADD COLUMN IF NOT EXISTS average_price numeric,
ADD COLUMN IF NOT EXISTS current_price numeric,
ADD COLUMN IF NOT EXISTS total_value numeric,
ADD COLUMN IF NOT EXISTS unrealized_pnl numeric,
ADD COLUMN IF NOT EXISTS realized_pnl numeric DEFAULT 0;

-- Update course2 title
UPDATE public.course2 SET title = 'Portfolio Position' WHERE title IS NOT NULL;

-- Insert sample portfolio positions into course2
INSERT INTO public.course2 (title, description, symbol, quantity, average_price, current_price, total_value, unrealized_pnl, tags) VALUES
('Apple Position', 'Current Apple stock position', 'AAPL', 5, 150.25, 155.80, 779.00, 27.75, ARRAY['tech', 'long']),
('Microsoft Position', 'Current Microsoft stock position', 'MSFT', 5, 300.75, 305.20, 1526.00, 22.25, ARRAY['tech', 'cloud']),
('Google Position', 'Current Google stock position', 'GOOGL', 8, 120.50, 122.15, 977.20, 13.20, ARRAY['tech', 'search']),
('NVIDIA Position', 'Current NVIDIA stock position', 'NVDA', 2, 450.00, 465.30, 930.60, 30.60, ARRAY['tech', 'ai']),
('Amazon Position', 'Current Amazon stock position', 'AMZN', 3, 130.25, 128.90, 386.70, -4.05, ARRAY['tech', 'ecommerce']);
