-- AI Study Planner — Hardening Migration (post-review)
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Bundles three fixes from the code/security review:
--   1. ai_usage — a per-user AI-generation counter for correct rate limiting
--      across all AI endpoints (replaces the wrong per-table buckets).
--   2. Unique constraints on flashcards / quiz_questions so concurrent
--      "generate" clicks can't insert duplicate cached sets.
--   3. reminder_log — makes the daily cron idempotent (no duplicate emails if
--      it double-fires).

-- 1. AI usage counter -------------------------------------------------------
create table if not exists public.ai_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.ai_usage enable row level security;

create policy "Users can manage their own ai usage"
  on public.ai_usage
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists ai_usage_user_created_idx on public.ai_usage(user_id, created_at);

-- 2. Prevent duplicate cached flashcard / quiz sets -------------------------
alter table public.flashcards
  add constraint flashcards_user_topic_pos_uniq unique (user_id, topic_id, position);

alter table public.quiz_questions
  add constraint quiz_questions_user_topic_pos_uniq unique (user_id, topic_id, position);

-- 3. Idempotent reminder emails ---------------------------------------------
create table if not exists public.reminder_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('daily', 'exam_countdown')),
  sent_date  date not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, sent_date)
);

alter table public.reminder_log enable row level security;
-- No user policies: written only by the service-role cron.
