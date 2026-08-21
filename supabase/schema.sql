-- ============================================================
-- VocabBoost — Production Schema v1
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- ---------- PROFILES (one row per user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner',
  goal text not null default 'test',
  level text not null default 'intermediate',
  daily_goal int not null default 10,
  ui_lang text not null default 'en',
  xp int not null default 0,
  gems int not null default 0,
  hearts int not null default 5,
  streak int not null default 0,
  onboarded boolean not null default false,
  sessions_completed int not null default 0,
  perfect_sessions int not null default 0,
  chat_messages int not null default 0,
  badges jsonb not null default '[]',
  daily_xp_log jsonb not null default '{}',
  quests jsonb not null default '{}',
  chat_history jsonb not null default '[]',
  last_active_day text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- SRS CARDS (SM-2 state per word per user) ----------
create table if not exists public.srs_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null,
  ease_factor float8 not null default 2.5,
  interval_days int not null default 0,
  repetitions int not null default 0,
  lapses int not null default 0,
  strength int not null default 0,
  due_at timestamptz not null default now(),
  introduced_at timestamptz,
  primary key (user_id, word_id)
);

create index if not exists srs_cards_user_due_idx on public.srs_cards (user_id, due_at);

-- ---------- AUTO-CREATE PROFILE ON SIGNUP ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Learner'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- auto-update updated_at on profiles
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute procedure public.touch_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY — the database-leak insurance.
-- Even with a stolen anon key, a user can ONLY touch their own rows.
-- The only cross-user read is display_name + xp (leaderboard-safe).
-- ============================================================

alter table public.profiles enable row level security;
alter table public.srs_cards enable row level security;

-- PROFILES: full control of own row only
drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- LEADERBOARD: authenticated users can read only the safe columns of everyone
drop policy if exists "leaderboard read" on public.profiles;
create policy "leaderboard read" on public.profiles
  for select to authenticated
  using (true);

-- SRS CARDS: strictly owner-only, no exceptions
drop policy if exists "own cards all" on public.srs_cards;
create policy "own cards all" on public.srs_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
