-- AI Study Planner — Notification Preferences Migration (Phase 7)
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Adds per-user opt-in/out flags for transactional reminder emails.
-- Defaults to on for both types. Users toggle these on /account; the
-- update goes through a service-role API route (profiles has no user
-- UPDATE policy, so tier stays immutable).

alter table public.profiles
  add column if not exists notification_preferences jsonb
    not null
    default '{"daily_reminder": true, "exam_countdown": true}'::jsonb;
