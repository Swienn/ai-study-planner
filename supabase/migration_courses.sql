-- AI Study Planner — Courses Migration
-- Run this in: Supabase Dashboard → SQL Editor → New query

-- 1. Courses table
create table public.courses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  color      text not null default 'blue'
               check (color in ('red','orange','yellow','green','blue','purple')),
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "Users can manage their own courses"
  on public.courses
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on public.courses(user_id);

-- 2. Add course_id to documents (nullable — existing docs are unaffected)
alter table public.documents
  add column course_id uuid references public.courses(id) on delete set null;

create index on public.documents(course_id) where course_id is not null;

-- 3. Add course_id to plans (nullable — existing plans are unaffected)
alter table public.plans
  add column course_id uuid references public.courses(id) on delete set null;

create index on public.plans(course_id) where course_id is not null;
