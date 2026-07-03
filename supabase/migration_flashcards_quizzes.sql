-- AI Study Planner — Flashcards & Quizzes Migration (Phase 9, paid feature)
-- Run this in: Supabase Dashboard → SQL Editor → New query

create table if not exists public.flashcards (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references public.topics(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  front      text not null,
  back       text not null,
  position   smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.flashcards enable row level security;

create policy "Users can manage their own flashcards"
  on public.flashcards
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists flashcards_topic_user_idx on public.flashcards(topic_id, user_id, position);

create table if not exists public.quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  topic_id      uuid not null references public.topics(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  question      text not null,
  options       jsonb not null,
  correct_index smallint not null,
  position      smallint not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.quiz_questions enable row level security;

create policy "Users can manage their own quiz questions"
  on public.quiz_questions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists quiz_questions_topic_user_idx on public.quiz_questions(topic_id, user_id, position);
