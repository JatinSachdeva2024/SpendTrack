-- ============================================================
-- SpendTrack — paste ALL of this into Supabase SQL Editor → Run
-- (Do NOT type the file path — copy this entire file's contents)
-- ============================================================

-- Spendings table
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

-- Profiles table (first name, last name, phone)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill profiles for users who signed up before this script was run
insert into public.profiles (id, first_name, last_name, phone)
select
  id,
  coalesce(raw_user_meta_data ->> 'first_name', ''),
  coalesce(raw_user_meta_data ->> 'last_name', ''),
  coalesce(raw_user_meta_data ->> 'phone', '')
from auth.users
on conflict (id) do update set
  first_name = case
    when profiles.first_name = '' then excluded.first_name
    else profiles.first_name
  end,
  last_name = case
    when profiles.last_name = '' then excluded.last_name
    else profiles.last_name
  end,
  phone = case
    when profiles.phone = '' then excluded.phone
    else profiles.phone
  end,
  updated_at = now();

-- Recurring expenses (monthly templates; reminders on the 1st)
create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  note text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists recurring_expenses_user_id_idx
  on public.recurring_expenses (user_id);

alter table public.recurring_expenses enable row level security;

drop policy if exists "Users read own recurring" on public.recurring_expenses;
drop policy if exists "Users insert own recurring" on public.recurring_expenses;
drop policy if exists "Users update own recurring" on public.recurring_expenses;
drop policy if exists "Users delete own recurring" on public.recurring_expenses;

create policy "Users read own recurring"
  on public.recurring_expenses for select
  using (auth.uid() = user_id);

create policy "Users insert own recurring"
  on public.recurring_expenses for insert
  with check (auth.uid() = user_id);

create policy "Users update own recurring"
  on public.recurring_expenses for update
  using (auth.uid() = user_id);

create policy "Users delete own recurring"
  on public.recurring_expenses for delete
  using (auth.uid() = user_id);

alter table public.spendings
  add column if not exists recurring_id uuid references public.recurring_expenses (id) on delete set null;

create index if not exists spendings_recurring_id_idx
  on public.spendings (user_id, recurring_id, date);
