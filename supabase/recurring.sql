-- Recurring expenses (run in Supabase SQL Editor after setup-all.sql)

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

-- Link spendings created from a recurring template
alter table public.spendings
  add column if not exists recurring_id uuid references public.recurring_expenses (id) on delete set null;

create index if not exists spendings_recurring_id_idx
  on public.spendings (user_id, recurring_id, date);
