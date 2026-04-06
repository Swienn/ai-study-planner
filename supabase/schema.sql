-- AI Study Planner — Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query

-- ============================================================
-- DOCUMENTS
-- Stores uploaded study material per user
-- ============================================================
create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  filename    text not null,
  raw_text    text not null,
  created_at  timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can manage their own documents"
  on public.documents
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- TOPICS
-- Extracted topics from a document (via Claude)
-- ============================================================
create table public.topics (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents(id) on delete cascade,
  title        text not null,
  summary      text not null,
  difficulty   smallint check (difficulty between 1 and 3), -- 1=easy, 2=medium, 3=hard
  position     smallint not null default 0,                 -- order within the document
  created_at   timestamptz not null default now()
);

alter table public.topics enable row level security;

create policy "Users can manage topics of their documents"
  on public.topics
  for all
  using (
    exists (
      select 1 from public.documents
      where documents.id = topics.document_id
        and documents.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.documents
      where documents.id = topics.document_id
        and documents.user_id = auth.uid()
    )
  );

-- ============================================================
-- PLANS
-- One study plan per subject / document set
-- ============================================================
create table public.plans (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  exam_date      date not null,
  hours_per_day  numeric(3,1) not null check (hours_per_day > 0),
  created_at     timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "Users can manage their own plans"
  on public.plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- PLAN DOCUMENTS
-- Which documents belong to a plan (many-to-many)
-- ============================================================
create table public.plan_documents (
  plan_id      uuid not null references public.plans(id) on delete cascade,
  document_id  uuid not null references public.documents(id) on delete cascade,
  primary key (plan_id, document_id)
);

alter table public.plan_documents enable row level security;

create policy "Users can manage their own plan documents"
  on public.plan_documents
  for all
  using (
    exists (
      select 1 from public.plans
      where plans.id = plan_documents.plan_id
        and plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.plans
      where plans.id = plan_documents.plan_id
        and plans.user_id = auth.uid()
    )
  );

-- ============================================================
-- PLAN ITEMS
-- One row = one topic assigned to one study day
-- ============================================================
create type public.plan_item_status as enum ('pending', 'completed', 'skipped');

create table public.plan_items (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.plans(id) on delete cascade,
  topic_id    uuid not null references public.topics(id) on delete cascade,
  date        date not null,
  status      public.plan_item_status not null default 'pending',
  created_at  timestamptz not null default now()
);

alter table public.plan_items enable row level security;

create policy "Users can manage plan items of their plans"
  on public.plan_items
  for all
  using (
    exists (
      select 1 from public.plans
      where plans.id = plan_items.plan_id
        and plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.plans
      where plans.id = plan_items.plan_id
        and plans.user_id = auth.uid()
    )
  );

-- ============================================================
-- INDEXES
-- Speed up the most common queries
-- ============================================================
create index on public.documents(user_id);
create index on public.topics(document_id);
create index on public.plans(user_id);
create index on public.plan_items(plan_id);
create index on public.plan_items(plan_id, date);
