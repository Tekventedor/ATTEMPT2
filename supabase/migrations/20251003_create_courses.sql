-- Create courses tables and RLS policies
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- Tables
create table if not exists public.course1 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  image_name text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course2 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  image_name text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.course1 enable row level security;
alter table public.course2 enable row level security;

-- Read policies
drop policy if exists "course1 select for authenticated" on public.course1;
create policy "course1 select for authenticated" on public.course1
  for select using (auth.role() = 'authenticated');

drop policy if exists "course2 select for authenticated" on public.course2;
create policy "course2 select for authenticated" on public.course2
  for select using (auth.role() = 'authenticated');

-- Write policies: owner or admin email can write
drop policy if exists "course1 insert own or admin" on public.course1;
drop policy if exists "course1 update own or admin" on public.course1;
drop policy if exists "course1 delete own or admin" on public.course1;
create policy "course1 insert own or admin" on public.course1
  for insert with check (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );
create policy "course1 update own or admin" on public.course1
  for update using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );
create policy "course1 delete own or admin" on public.course1
  for delete using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );

drop policy if exists "course2 insert own or admin" on public.course2;
drop policy if exists "course2 update own or admin" on public.course2;
drop policy if exists "course2 delete own or admin" on public.course2;
create policy "course2 insert own or admin" on public.course2
  for insert with check (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );
create policy "course2 update own or admin" on public.course2
  for update using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );
create policy "course2 delete own or admin" on public.course2
  for delete using (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'hugolewis01@icloud.com'
  );


