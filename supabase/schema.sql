-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.spendings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  note text not null default '',
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists spendings_user_id_date_idx
  on public.spendings (user_id, date desc);

alter table public.spendings enable row level security;

drop policy if exists "Users read own spendings" on public.spendings;
drop policy if exists "Users insert own spendings" on public.spendings;
drop policy if exists "Users update own spendings" on public.spendings;
drop policy if exists "Users delete own spendings" on public.spendings;

create policy "Users read own spendings"
  on public.spendings for select
  using (auth.uid() = user_id);

create policy "Users insert own spendings"
  on public.spendings for insert
  with check (auth.uid() = user_id);

create policy "Users update own spendings"
  on public.spendings for update
  using (auth.uid() = user_id);

create policy "Users delete own spendings"
  on public.spendings for delete
  using (auth.uid() = user_id);

-- Profiles: see supabase/profiles.sql
