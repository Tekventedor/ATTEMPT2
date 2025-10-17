-- Create trading dashboard schema
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- Trading logs table
create table if not exists public.trading_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  timestamp timestamptz not null default now(),
  action text not null, -- 'BUY', 'SELL', 'HOLD', 'ANALYSIS', 'ERROR'
  symbol text not null,
  quantity numeric,
  price numeric,
  total_value numeric,
  reason text,
  confidence_score numeric, -- 0-1 confidence in the decision
  market_data jsonb, -- store relevant market data at time of decision
  created_at timestamptz not null default now()
);

-- Portfolio positions table
create table if not exists public.portfolio_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  symbol text not null,
  quantity numeric not null,
  average_price numeric not null,
  current_price numeric,
  total_value numeric,
  unrealized_pnl numeric,
  realized_pnl numeric default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, symbol)
);

-- Performance metrics table
create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  date date not null,
  total_portfolio_value numeric not null,
  daily_pnl numeric not null,
  total_pnl numeric not null,
  win_rate numeric, -- percentage of profitable trades
  sharpe_ratio numeric,
  max_drawdown numeric,
  total_trades integer default 0,
  winning_trades integer default 0,
  losing_trades integer default 0,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

-- AI Agent settings table
create table if not exists public.ai_agent_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  is_active boolean default true,
  trading_mode text default 'paper', -- 'paper' or 'live'
  risk_level text default 'medium', -- 'low', 'medium', 'high'
  max_position_size numeric default 1000,
  stop_loss_percentage numeric default 0.05,
  take_profit_percentage numeric default 0.10,
  trading_hours jsonb, -- store trading hours preferences
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Enable RLS
alter table public.trading_logs enable row level security;
alter table public.portfolio_positions enable row level security;
alter table public.performance_metrics enable row level security;
alter table public.ai_agent_settings enable row level security;

-- RLS Policies for trading_logs
drop policy if exists "trading_logs select for authenticated" on public.trading_logs;
create policy "trading_logs select for authenticated" on public.trading_logs
  for select using (auth.role() = 'authenticated');

drop policy if exists "trading_logs insert own or admin" on public.trading_logs;
create policy "trading_logs insert own or admin" on public.trading_logs
  for insert with check (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

drop policy if exists "trading_logs update own or admin" on public.trading_logs;
create policy "trading_logs update own or admin" on public.trading_logs
  for update using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

drop policy if exists "trading_logs delete own or admin" on public.trading_logs;
create policy "trading_logs delete own or admin" on public.trading_logs
  for delete using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

-- RLS Policies for portfolio_positions
drop policy if exists "portfolio_positions select for authenticated" on public.portfolio_positions;
create policy "portfolio_positions select for authenticated" on public.portfolio_positions
  for select using (auth.role() = 'authenticated');

drop policy if exists "portfolio_positions insert own or admin" on public.portfolio_positions;
create policy "portfolio_positions insert own or admin" on public.portfolio_positions
  for insert with check (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

drop policy if exists "portfolio_positions update own or admin" on public.portfolio_positions;
create policy "portfolio_positions update own or admin" on public.portfolio_positions
  for update using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

drop policy if exists "portfolio_positions delete own or admin" on public.portfolio_positions;
create policy "portfolio_positions delete own or admin" on public.portfolio_positions
  for delete using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

-- RLS Policies for performance_metrics
drop policy if exists "performance_metrics select for authenticated" on public.performance_metrics;
create policy "performance_metrics select for authenticated" on public.performance_metrics
  for select using (auth.role() = 'authenticated');

drop policy if exists "performance_metrics insert own or admin" on public.performance_metrics;
create policy "performance_metrics insert own or admin" on public.performance_metrics
  for insert with check (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

drop policy if exists "performance_metrics update own or admin" on public.performance_metrics;
create policy "performance_metrics update own or admin" on public.performance_metrics
  for update using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

drop policy if exists "performance_metrics delete own or admin" on public.performance_metrics;
create policy "performance_metrics delete own or admin" on public.performance_metrics
  for delete using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

-- RLS Policies for ai_agent_settings
drop policy if exists "ai_agent_settings select for authenticated" on public.ai_agent_settings;
create policy "ai_agent_settings select for authenticated" on public.ai_agent_settings
  for select using (auth.role() = 'authenticated');

drop policy if exists "ai_agent_settings insert own or admin" on public.ai_agent_settings;
create policy "ai_agent_settings insert own or admin" on public.ai_agent_settings
  for insert with check (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

drop policy if exists "ai_agent_settings update own or admin" on public.ai_agent_settings;
create policy "ai_agent_settings update own or admin" on public.ai_agent_settings
  for update using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

drop policy if exists "ai_agent_settings delete own or admin" on public.ai_agent_settings;
create policy "ai_agent_settings delete own or admin" on public.ai_agent_settings
  for delete using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

-- Create indexes for better performance
create index if not exists idx_trading_logs_user_timestamp on public.trading_logs(user_id, timestamp desc);
create index if not exists idx_trading_logs_symbol on public.trading_logs(symbol);
create index if not exists idx_portfolio_positions_user on public.portfolio_positions(user_id);
create index if not exists idx_performance_metrics_user_date on public.performance_metrics(user_id, date desc);
create index if not exists idx_ai_agent_settings_user on public.ai_agent_settings(user_id);
