# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is StudyTool?

**StudyTool** is a web app that turns uploaded PDFs into personalised, day-by-day study schedules. It's built by Sven (SWE student at UvA) as a portfolio project and potential side business targeting students.

The app name is **StudyTool** — use this name consistently in UI text, emails, and copy. Do not use "AI Study Planner" or "StudyPlanner".

**Domain**: `studytool.academy` — live at `https://studytool.academy`, deployed on Vercel.

**Remaining URL/email placeholders** — the following still need updating when email is configured:
- `privacy@studytool.academy` in `/privacy` page — needs a real inbox (set up via Resend or Namecheap email)
- `NEXT_PUBLIC_SITE_URL` in `.env.local` stays `http://localhost:3000` for local dev; Vercel has `https://studytool.academy`

**The core problem it solves**: students have an exam date, a pile of PDFs, and no idea how to spread the material across the days they have left.

**The product flow**:
1. A student creates a **Course** (e.g. "Linear Algebra") and assigns it a colour.
2. They upload one or more **PDFs** — lecture slides, textbooks, notes. Claude (Haiku) reads each PDF and extracts a structured list of **topics** with title, summary, difficulty, and estimated study time in minutes.
3. They create a **Study Plan** by picking a start date, exam date, and daily hours budget. The scheduler distributes topics across available days using a minutes-based budget, respecting existing plans from other courses.
4. They study day by day — marking topics as done or skipped.
5. The central **Calendar** gives a bird's-eye view of every course's plan across the week, colour-coded by course.

**Who it's for**: university students juggling multiple courses, each with its own exam date. The conflict-aware scheduler is the key differentiator — adding a new course automatically fits around existing ones.

**Business model**: Freemium. Free tier: 2 courses, 3 PDFs/course, 3 plans. Premium: €8/month, unlimited everything. Dev tier: unlimited, set manually in DB.

## UI architecture

All authenticated pages use a shared **AppLayout** (sidebar + topbar):

```
components/
  AppLayout.tsx       → wraps every authenticated page
  AppSidebar.tsx      → left nav: Dashboard, Calendar, Courses links
  AppTopBar.tsx       → top bar with page title and user menu (+ Account link)
  SidebarClient.tsx   → client-side sidebar state (mobile toggle etc.)
  CookieBanner.tsx    → EU cookie consent banner, mounted in root layout
  UpgradeBanner.tsx   → shown inline when a free-tier limit is hit (403 response)
  Skeleton.tsx        → animate-pulse skeleton primitive
  PageShell.tsx       → static layout shell used by loading.tsx files
```

Design system: **indigo** as primary accent (`indigo-600`), white backgrounds, `rounded-xl` inputs and buttons, `slate-*` for text hierarchy, Geist Sans font.

After login/signup, users are directed to `/calendar` (not `/dashboard`).

The **Calendar** (`/calendar`) uses a week-view grid: one row per course, seven columns for the days of the week. Users navigate between weeks with prev/next arrows. Clicking a day cell deep-links to the plan's day view (`/plans/[id]?date=YYYY-MM-DD`).

The **Plan view** (`/plans/[id]`) shows topics for a specific date (day-view mode) when a `?date=` param is present. It has tabs per uploaded document so students can focus on one PDF at a time.

## Commands

```bash
npm run dev       # start dev server at localhost:3000
npm run build     # production build (run this to catch type errors before committing)
npm run lint      # eslint
```

Always run `npm run build` before committing to catch TypeScript errors early.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Database + Auth + Storage**: Supabase (PostgreSQL with RLS)
- **AI**: Anthropic Claude API — `claude-haiku-4-5-20251001` for topic extraction
- **Payments**: Stripe (subscriptions, billing portal)
- **Deployment**: Vercel (not yet deployed)

### Next.js 16 differences from earlier versions

- `middleware.ts` is now `proxy.ts`, exported function must be named `proxy`
- `params` in route handlers and pages is `Promise<{ id: string }>` — always `await params`
- `serverExternalPackages` replaces `experimental.serverComponentsExternalPackages`

## Architecture

### User flow

1. User creates a **Course** (title + color)
2. Uploads one or more PDFs to the course → Claude extracts topics per PDF
3. Creates a **Study Plan** for the course → topics distributed across days between start date and exam date using conflict-aware scheduler
4. Views day-by-day plan, marks topics done/skipped
5. Central **Calendar** shows all plans across all courses, color-coded

### File structure

```
src/
├── app/
│   ├── api/
│   │   ├── account/
│   │   │   ├── delete/           → DELETE auth user + all data + storage files
│   │   │   └── export/           → GET JSON export of all user data (GDPR)
│   │   ├── auth/signout/         → POST sign out
│   │   ├── courses/              → GET list, POST create (tier-limited)
│   │   ├── courses/[id]/         → GET detail, DELETE
│   │   ├── documents/[id]/       → DELETE (also removes from storage)
│   │   ├── documents/upload/     → POST upload PDF + Claude extraction (rate-limited, tier-limited)
│   │   ├── plan-items/[id]/      → PATCH status (pending/completed/skipped)
│   │   ├── plans/                → POST create plan (rate-limited, tier-limited)
│   │   ├── plans/[id]/           → DELETE + PATCH (regenerate)
│   │   └── stripe/
│   │       ├── checkout/         → POST create Stripe checkout session
│   │       ├── portal/           → POST create Stripe billing portal session
│   │       └── webhook/          → POST Stripe webhook (updates profiles.tier)
│   ├── account/                  → billing page: plan badge, usage bars, upgrade/manage, GDPR controls
│   ├── auth/callback/            → email confirmation + OAuth callback handler
│   ├── calendar/                 → full calendar view (all courses)
│   ├── courses/
│   │   ├── new/                  → create course form
│   │   └── [id]/                 → course detail, upload PDFs, create plan
│   ├── dashboard/                → course cards, uncategorised docs/plans
│   ├── forgot-password/          → request password reset email
│   ├── privacy/                  → privacy policy page
│   ├── reset-password/           → set new password (landed from email link)
│   ├── terms/                    → terms of service page
│   ├── verify-email/             → gate for unverified users with resend button
│   ├── plans/[id]/               → day-by-day plan view, progress tracking
│   ├── login/ signup/            → auth pages (with Google OAuth button)
│   └── page.tsx                  → landing page
├── components/
│   ├── AppLayout.tsx             → wraps every authenticated page
│   ├── AppSidebar.tsx            → left nav
│   ├── AppTopBar.tsx             → top bar with user menu and Account link
│   ├── CookieBanner.tsx          → EU cookie consent, shown once, dismissed to localStorage
│   ├── PageShell.tsx             → static layout shell used by loading.tsx files
│   ├── Skeleton.tsx              → animate-pulse skeleton primitive
│   └── UpgradeBanner.tsx         → amber banner shown on 403 limit responses with link to /account
├── lib/
│   ├── anthropic.ts              → Anthropic client (server-side only)
│   ├── planScheduler.ts          → pure scheduling logic (minutes-based), no DB imports
│   ├── rateLimit.ts              → DB-based rate limiter
│   ├── stripe.ts                 → lazy Stripe singleton + PREMIUM_PRICE_ID
│   ├── tier.ts                   → getUserTier(), LIMITS, Tier type
│   └── supabase/
│       ├── admin.ts              → service-role client (webhook + account delete only)
│       ├── client.ts             → browser client (use in "use client" components)
│       └── server.ts             → server client (use in API routes + server components)
└── proxy.ts                      → auth proxy; checks email_confirmed_at; protects /dashboard /courses /plans /calendar /account
```

### Database schema

```
profiles      user_id, tier(free/paid/dev), stripe_customer_id, stripe_subscription_id
courses       id, user_id, title, color
documents     id, user_id, course_id(nullable), filename, raw_text
topics        id, document_id, title, summary, difficulty(1-3), position, minutes(integer default 30)
plans         id, user_id, course_id(nullable), title, exam_date, hours_per_day
plan_documents plan_id, document_id
plan_items    id, plan_id, topic_id, date, status(pending/completed/skipped)
```

All tables have RLS — users can only access their own rows. `profiles` has SELECT-only RLS for users (no UPDATE), so tier can only be changed via service-role webhook or direct DB edit.

`course_id` is nullable on `documents` and `plans` for backwards compatibility with pre-course uploads.

Migrations already applied:
- `supabase/migration_profiles.sql` — profiles table + auto-create trigger on auth.users insert
- `supabase/migration_minutes.sql` — adds `minutes` column to topics

### Key patterns

**Auth in API routes** — always use `supabase.auth.getUser()` (validates JWT server-side), never `getSession()`:
```ts
const supabase = await createClient(); // from @/lib/supabase/server
const { data: { user } } = await supabase.auth.getUser();
if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

**PDF upload security** — validate magic bytes (`%PDF` = `0x25 0x50 0x44 0x46`), not just MIME type. Create two independent `Buffer.from(arrayBuffer.slice(0))` copies before passing to pdf-parse — pdfjs-dist detaches the ArrayBuffer it receives, which corrupts the storage upload.

**Scheduling** — `src/lib/planScheduler.ts` takes `TopicWithTime[]` (each `{ id, minutes }`), `startDateStr`, `examDateStr`, `hoursPerDay`, and a `Map<date, existingMinutes>` of already-scheduled load in minutes. Budgets `hoursPerDay * 60` minutes per day, spreads overflow evenly across days, guarantees at least one topic per day. Works only with `YYYY-MM-DD` strings to avoid timezone issues.

**Tier system** — `src/lib/tier.ts` exports `getUserTier(supabase, userId)` and `LIMITS` object. Free: 2 courses, 3 PDFs/course, 3 plans. Paid/Dev: unlimited. Dev tier can only be set manually in DB — no API route sets it, webhook has `.neq("tier", "dev")`, RLS has no UPDATE for users.

**Stripe** — lazy singleton in `src/lib/stripe.ts` via `getStripe()` to avoid build-time failure when env var is empty. Webhook uses `createAdminClient()` (service role, bypasses RLS). Never initialize Stripe at module level.

**Rate limiting** — DB-based (no Redis): `src/lib/rateLimit.ts` counts rows in a window using Supabase. Applied to all mutating API routes.

**Upgrade prompt** — client components catch HTTP 403 responses and set `limitHit` state to show `<UpgradeBanner>` instead of a plain error. The banner links to `/account`.

**Supabase trigger** — the `handle_new_user` trigger must use `public.` schema prefix and `SET search_path = public` or Supabase's auth system cannot find it.

**Supabase nested joins** — avoid deep joins with `select("a, b(c(d))")` — they silently return null for ambiguous FKs. Fetch separately and join in JS instead.

**Tailwind dynamic classes** — use complete class name strings in lookup objects, never template literals like `` `bg-${color}-500` ``.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     # service role — server-only, never expose to client
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY             # sk_test_... for dev, sk_live_... for prod
STRIPE_WEBHOOK_SECRET         # whsec_... from Stripe CLI or dashboard
STRIPE_PRICE_ID               # price_... for the Premium subscription product
NEXT_PUBLIC_SITE_URL          # http://localhost:3000 in dev, production URL in prod
```

For local webhook testing run `stripe listen --forward-to localhost:3000/api/stripe/webhook` (requires `stripe login` first).

## Build roadmap

✅ = done · 🔲 = not started

### Phase 1 — Email & Auth
- 1.1 ✅ Custom email sending via Resend — domain verified (studytool.academy, eu-west-1), Supabase SMTP configured (smtp.resend.com:465), confirmation + password-reset templates customized
- 1.2 🔲 Account settings — change email and password fields on `/account`
- 1.3 ✅ Password reset flow — "Forgot password?" link on login → `/forgot-password` → email → `/reset-password`; `auth/callback` detects `type=recovery` and redirects correctly
- 1.4 ✅ Email verification gate — `proxy.ts` checks `user.email_confirmed_at`, redirects unverified users to `/verify-email`; resend button calls `supabase.auth.resend()`
- 1.5 🔲 Google OAuth — button exists on login + signup pages but not functional yet; needs Google Cloud Console OAuth credentials (requires credit card for Google Cloud) then enable in Supabase → Authentication → Providers → Google

### Phase 2 — Legal & Trust
- 2.1 ✅ `/privacy` and `/terms` pages — data processor disclosures (Supabase, Anthropic, Stripe, Vercel), Dutch law governing clause, GDPR rights section
- 2.2 ✅ Cookie consent banner — shown once per browser, dismissed to localStorage, links to privacy policy
- 2.3 ✅ GDPR data controls — "Export my data" JSON download (`GET /api/account/export`) and "Delete my account" with confirmation (`DELETE /api/account/delete`); both on `/account` page

### Phase 3 — Subscriptions
- 3.1 ✅ `profiles` table — `user_id, tier(free/paid/dev), stripe_customer_id, stripe_subscription_id`; auto-created by DB trigger on `auth.users` insert; RLS: SELECT-only for users (no UPDATE — tier is immutable from client)
- 3.2 ✅ Tier limits — Free: 2 courses, 3 PDFs/course, 3 plans · Paid: unlimited · Dev: unlimited (set manually in DB only); enforced in all API routes with `getUserTier()` + `LIMITS` from `src/lib/tier.ts`
- 3.3 ✅ Rate limiting — DB-based (no Redis); applied to upload (5/min), plans (10/min), courses (10/min)
- 3.4 ✅ Stripe checkout — `POST /api/stripe/checkout` creates session (reuses existing customer); `POST /api/stripe/webhook` updates `profiles.tier` on subscription events; never touches dev accounts (`.neq("tier","dev")`)
- 3.5 ✅ Stripe CLI local webhook forwarding — `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- 3.6 ✅ Upgrade prompt UI — `UpgradeBanner` shown inline on 403 responses in NewCourseForm, CourseUploadWidget, CoursePlanCreator; submit button disabled after limit hit
- 3.7 ✅ `/account` billing page — plan badge, usage bars, upgrade button (checkout), manage subscription button (billing portal via `POST /api/stripe/portal`)
- 3.8 🔲 Google AdSense integration for free-tier users — show non-intrusive banner ads; remove ads on upgrade

### Phase 4 — Onboarding
- 4.1 🔲 Empty states — calendar, dashboard, course page each explain what to do when there's no data yet
- 4.2 🔲 First-time `/onboarding` wizard — 3 steps: create course → upload PDF → create plan; skip if user already has a course

### Phase 5 — Agenda / Blocked Days
- 5.1 🔲 `agenda_blocks` table — `id, user_id, date, title, created_at` with RLS
- 5.2 🔲 Calendar UI — click an empty day cell to add/remove a personal block; shown in a distinct neutral colour
- 5.3 🔲 Scheduler integration — fetch blocks between start/exam date, treat blocked days as fully unavailable

### Phase 6 — Rescheduling
- 6.1 🔲 Highlight past days in plan view that still have pending topics
- 6.2 🔲 "Reschedule remaining" button — redistributes all pending topics from today forward, respecting agenda blocks and other plans
- 6.3 🔲 Single-topic reschedule — move one topic to tomorrow or next available slot

### Phase 7 — Notifications & Reminders
- 7.1 🔲 `notification_preferences` column on `profiles` — opt-in/out per notification type
- 7.2 🔲 Daily reminder email via Resend + Vercel cron — "You have X topics today for [Course]"
- 7.3 🔲 Exam countdown email — sent 3 days before exam date: "Your exam is in 3 days — here's what's left"

### Phase 8 — Study Experience
- 8.1 🔲 Topic chat — "Ask Claude" button per topic; `POST /api/topics/[id]/chat`; `chat_messages(id, topic_id, user_id, role, content, created_at)` table; streaming response
- 8.2 🔲 Exam mode — day-before-exam view: all topics as condensed bullet summaries generated by Claude; cached in `topics.study_guide`
- 8.3 🔲 Progress analytics — completion %, study streak, estimated hours remaining per course
- 8.4 🔲 Exam countdown badge — days-until-exam shown on plan view header and calendar cells

### Phase 9 — Flashcards & Quizzes (paid only)
- 9.1 🔲 `flashcards(id, topic_id, user_id, front, back)` and `quiz_questions(id, topic_id, user_id, question, options json, correct_index)` tables
- 9.2 🔲 Claude Haiku generates 5-10 flashcards + 5 quiz questions per topic on demand; results cached in DB; `POST /api/topics/[id]/flashcards` and `/quiz`
- 9.3 🔲 Day view — "Flashcards" and "Quiz" tab per course section; flip-card UI; scored quiz with results summary
- 9.4 🔲 Free users see locked buttons with upgrade prompt

### Phase 10 — Deploy to Vercel
- 10.1 🔲 Confirm `npm run build` is clean; no secrets accidentally prefixed `NEXT_PUBLIC_`
- 10.2 🔲 Unit tests for `planScheduler.ts` — basic scheduling, overflow spreading, blocked days, conflict avoidance
- 10.3 🔲 GitHub Actions CI — run tests on every push; Vercel deploys only on green
- 10.4 🔲 Connect GitHub repo to Vercel; set all env vars (Supabase, Anthropic, Stripe live keys, Resend)
- 10.5 🔲 Supabase: set Site URL + Redirect URLs to production domain; switch Stripe to live mode keys; update placeholder emails/URLs in privacy + terms pages
- 10.6 🔲 Domain — buy on Namecheap / Porkbun, point to Vercel (auto SSL); or use `your-app.vercel.app` subdomain to start

### Phase 11 — UI Redesign
- 11.1 🔲 Coordinate with external contributor on colour system and component structure before any file changes to avoid conflicts
- 11.2 🔲 Implement new design — replace current indigo/slate palette and card layouts; keep logic components untouched
