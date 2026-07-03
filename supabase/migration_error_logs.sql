-- AI Study Planner — Error Logs Migration (Phase 10.7)
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Captures user-facing errors (client error boundaries + server API failures)
-- so production problems are visible. Written only via the service role
-- (see src/lib/errorLog.ts); RLS is enabled with NO user policies, so regular
-- users can neither read nor write this table.

create table public.error_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  source     text not null check (source in ('client', 'server')),
  route      text,
  message    text not null,
  stack      text,
  created_at timestamptz not null default now()
);

alter table public.error_logs enable row level security;
-- No policies: only the service-role key (which bypasses RLS) can touch this.

create index on public.error_logs(created_at desc);
create index on public.error_logs(user_id) where user_id is not null;
