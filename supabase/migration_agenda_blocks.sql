-- AI Study Planner — Agenda Blocks Migration (Phase 5)
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Personal blocked days: a user marks a date as unavailable, and the
-- scheduler treats it as fully occupied (no topics assigned that day).
-- This table was originally applied ad-hoc to the live DB; this file
-- backfills it into version control so the schema can be rebuilt.

create table public.agenda_blocks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  title      text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.agenda_blocks enable row level security;

create policy "Users can manage their own agenda blocks"
  on public.agenda_blocks
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on public.agenda_blocks(user_id, date);
