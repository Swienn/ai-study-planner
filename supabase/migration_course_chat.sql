-- AI Study Planner — Course Chat Migration (Phase 8.1 extension)
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Course-level "Ask Claude" chat (grounded on the whole course's material),
-- alongside the existing per-topic chat_messages table.

create table if not exists public.course_chat_messages (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

alter table public.course_chat_messages enable row level security;

create policy "Users can manage their own course chat messages"
  on public.course_chat_messages
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists course_chat_messages_course_user_idx
  on public.course_chat_messages(course_id, user_id, created_at);
