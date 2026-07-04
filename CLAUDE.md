# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is StudyTool?

**StudyTool** is a web app that turns uploaded PDFs into personalised, day-by-day study schedules. It's built by Sven (SWE student at UvA) as a portfolio project and potential side business targeting students.

The app name is **StudyTool** — use this name consistently in UI text, emails, and copy. Do not use "AI Study Planner" or "StudyPlanner".

**Domain**: `studytool.academy` — live at `https://studytool.academy`, deployed on Vercel. Email forwarding: `privacy@studytool.academy` → personal inbox.

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
  AppSidebar.tsx      → left nav: Calendar link + collapsible course list with plan dates; course names navigate to /courses/[id]
  AppTopBar.tsx       → top bar with logo, user email, Account link, Sign out button
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
npm run dev        # start dev server at localhost:3000
npm run build      # production build (run this to catch type errors before committing)
npm run lint       # eslint — MUST pass; CI runs it and fails the build on errors
npm test           # vitest run — unit tests (scoped to src/**/*.test.ts via vitest.config.ts)
npm run test:watch # vitest in watch mode
npm run test:e2e   # Playwright end-to-end (starts/reuses the dev server) — see e2e/README.md
npm run test:e2e:ui # Playwright interactive UI mode
```

**Testing layers:** `src/**/*.test.ts` are Vitest unit tests (planScheduler, analytics).
`e2e/*.spec.ts` are Playwright browser tests (public pages + redirects always run;
authenticated flows run only when `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` are set).
Vitest is scoped to `src/` so it doesn't pick up the e2e specs; eslint ignores
`playwright-report/`, `test-results/`. Note: shadcn `<Button render={<Link/>}>` renders
`<a role="button">`, so match those in tests by role `button`, not `link`.

Before committing/pushing, run **all three**: `npm run build`, `npm run lint`, and `npm test`.
CI (`.github/workflows/ci.yml`) runs lint + tests on every push to `main`, so a lint
error that `next build` ignores (e.g. `react/no-unescaped-entities`, `react-hooks/set-state-in-effect`)
will still turn CI red. `npm run build` alone is NOT enough. Note: eslint ignores `.claude/**`
(harness worktrees) — see `eslint.config.mjs`.

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
│   ├── onboarding/               → 3-step first-time wizard (course → PDF → plan); skips if user has courses
│   ├── forgot-password/          → request password reset email
│   ├── privacy/                  → privacy policy page
│   ├── reset-password/           → set new password (landed from email link)
│   ├── terms/                    → terms of service page
│   ├── verify-email/             → gate for unverified users with resend button
│   ├── plans/[id]/               → day-by-day plan view, progress tracking
│   ├── tutorial/                 → "How it works" 5-step walkthrough (linked from sidebar footer)
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
profiles      user_id, tier(free/paid/dev), stripe_customer_id, stripe_subscription_id, notification_preferences(jsonb)
courses       id, user_id, title, color
documents     id, user_id, course_id(nullable), filename, raw_text
topics        id, document_id, title, summary, difficulty(1-3), position, minutes(integer default 30), study_guide(nullable)
plans         id, user_id, course_id(nullable), title, exam_date, hours_per_day
plan_documents plan_id, document_id
plan_items    id, plan_id, topic_id, date, status(pending/completed/skipped), completed_at(nullable)
agenda_blocks id, user_id, date, title
chat_messages id, topic_id, user_id, role(user/assistant), content, created_at
course_chat_messages id, course_id, user_id, role(user/assistant), content, created_at
flashcards    id, topic_id, user_id, front, back, position
quiz_questions id, topic_id, user_id, question, options(jsonb), correct_index, position
error_logs    id, user_id(nullable), source(client/server), route, message, stack, created_at
ai_usage      id, user_id, created_at   (per-user AI-generation counter for rate limiting)
reminder_log  id, user_id, kind(daily/exam_countdown), sent_date, created_at   (cron idempotency; unique per user/kind/day)
```

All tables have RLS — users can only access their own rows. `profiles` has SELECT-only RLS for users (no UPDATE), so tier can only be changed via service-role webhook or direct DB edit.

`course_id` is nullable on `documents` and `plans` for backwards compatibility with pre-course uploads.

Migrations already applied:
- `supabase/schema.sql` — base tables (documents, topics, plans, plan_documents, plan_items) + RLS
- `supabase/storage.sql` — storage bucket + policies for uploaded PDFs
- `supabase/migration_courses.sql` — courses table + nullable `course_id` on documents/plans
- `supabase/migration_profiles.sql` — profiles table + auto-create trigger on auth.users insert
- `supabase/migration_minutes.sql` — adds `minutes` column to topics
- `supabase/migration_agenda_blocks.sql` — agenda_blocks table + RLS (Phase 5; backfilled into version control)
- `supabase/migration_notifications.sql` — notification_preferences JSONB column on profiles (Phase 7)
- `supabase/migration_error_logs.sql` — error_logs table, RLS-locked to service role (Phase 10.7)
- `supabase/migration_study_experience.sql` — plan_items.completed_at, topics.study_guide, chat_messages table (Phase 8)
- `supabase/migration_flashcards_quizzes.sql` — flashcards + quiz_questions tables, RLS per-user (Phase 9)
- `supabase/migration_course_chat.sql` — course_chat_messages table (per-course "Ask Claude", alongside per-topic chat)
- `supabase/migration_hardening.sql` — post-review fixes: `ai_usage` (correct AI rate-limit bucket via `src/lib/aiUsage.ts` `allowAiUsage`), unique constraints on flashcards/quiz_questions (no duplicate cached sets), `reminder_log` (idempotent cron)

### Key patterns

**Auth in API routes** — always use `supabase.auth.getUser()` (validates JWT server-side), never `getSession()`:
```ts
const supabase = await createClient(); // from @/lib/supabase/server
const { data: { user } } = await supabase.auth.getUser();
if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

**Auth callback (`/auth/callback`)** — handles BOTH flows: the email-link OTP flow
(`?token_hash=...&type=signup|recovery|email_change` → `verifyOtp`) and the PKCE/OAuth
code flow (`?code=...` → `exchangeCodeForSession`). On failure it redirects to
`/login?error=confirmation_failed` rather than silently bouncing through a protected page.
⚠️ **Supabase dashboard requirement:** the confirmation/recovery email templates
(Authentication → Email Templates) MUST use the token_hash format, e.g.
`{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup` (and `type=recovery`
for reset). The default `{{ .ConfirmationURL }}` points at Supabase's own verify endpoint and
does NOT hit `/auth/callback`, which caused new signups to land on `/login` still unconfirmed.

**PDF upload security** — validate magic bytes (`%PDF` = `0x25 0x50 0x44 0x46`), not just MIME type. Create two independent `Buffer.from(arrayBuffer.slice(0))` copies before passing to pdf-parse — pdfjs-dist detaches the ArrayBuffer it receives, which corrupts the storage upload.

**Scheduling** — `src/lib/planScheduler.ts` takes `TopicWithTime[]` (each `{ id, minutes }`), `startDateStr`, `examDateStr`, `hoursPerDay`, and a `Map<date, existingMinutes>` of already-scheduled load in minutes. Budgets `hoursPerDay * 60` minutes per day, spreads overflow evenly across days, guarantees at least one topic per day. Works only with `YYYY-MM-DD` strings to avoid timezone issues.

**Tier system** — `src/lib/tier.ts` exports `getUserTier(supabase, userId)` and `LIMITS` object. Free: 2 courses, 3 PDFs/course, 3 plans. Paid/Dev: unlimited. Dev tier can only be set manually in DB — no API route sets it, webhook has `.neq("tier", "dev")`, RLS has no UPDATE for users.

**Stripe** — lazy singleton in `src/lib/stripe.ts` via `getStripe()` to avoid build-time failure when env var is empty. Webhook uses `createAdminClient()` (service role, bypasses RLS). Never initialize Stripe at module level.

**Rate limiting** — DB-based (no Redis): `src/lib/rateLimit.ts` counts rows in a window using Supabase. Applied to all mutating API routes. **AI generation routes** (chat/summary/flashcards/quiz/exam-mode) use `src/lib/aiUsage.ts` `allowAiUsage()` — a per-user counter on the `ai_usage` table (20/min), so the limit tracks actual generations rather than an unrelated table. `/api/errors` also rate-limits anonymous reporters (global cap) so it can't be flooded.

**Quiz answers** — `correct_index` is NEVER sent to the client. Options are shuffled once at generation time and persisted; the client submits answers to `POST /api/topics/[id]/quiz/score`, which scores server-side and returns the correct options only after submission.

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
RESEND_API_KEY                # for transactional emails (reminder/countdown emails, Phase 7)
CRON_SECRET                   # random secret; Vercel Cron sends it as `Authorization: Bearer <CRON_SECRET>` to /api/cron/reminders
```

For local webhook testing run `stripe listen --forward-to localhost:3000/api/stripe/webhook` (requires `stripe login` first).

**Stripe go-live checklist** — the code is fully env-driven, so switching from test/sandbox to live is *config only, no code changes*:
1. **Activate** the Stripe account for live payments (business + bank details). ⏳ **BLOCKED / TODO (Sven):** requires a **KvK number** (Dutch Chamber of Commerce registration) before Stripe can be activated for live payments in NL. Register the business first, then continue. This is the long pole.
2. Toggle the dashboard to **Live mode**, then create the Premium **product + €8/month recurring price** (products/prices do NOT carry over from test mode) → copy the live `price_...` ID.
3. Developers → API keys (Live) → copy `sk_live_...`.
4. Developers → **Webhooks → Add endpoint**: `https://studytool.academy/api/stripe/webhook`; subscribe to exactly these events the handler uses: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` → copy the live signing secret `whsec_...`.
5. Settings → Billing → **Customer portal → activate & save in Live mode** (portal config is per-mode; `billingPortal.sessions.create` throws if the live portal isn't configured).
6. **Vercel → Production env vars**: set `STRIPE_SECRET_KEY=sk_live_...`, `STRIPE_PRICE_ID=<live price>`, `STRIPE_WEBHOOK_SECRET=<live whsec>`; confirm `NEXT_PUBLIC_SITE_URL=https://studytool.academy`. **Redeploy** so the new vars take effect.
7. **Test end-to-end**: upgrade with a real card (then refund yourself in Stripe), confirm the webhook flips `profiles.tier` to `paid` and that "Manage subscription" opens the live portal. Dev accounts are never downgraded (`.neq("tier","dev")`). The subscription carries `supabase_user_id` via `subscription_data.metadata`, which the webhook reads to find the user.

**Cron / reminder emails** — `vercel.json` schedules `GET /api/cron/reminders` daily at 06:00 UTC (≈07–08 CET). The route uses the service-role client to scan all users' plans, sending a daily reminder (today's pending topics) and an exam countdown (3 days before an exam). It respects `profiles.notification_preferences` and is gated on the `CRON_SECRET` header. Vercel Cron only fires in production. To test locally: `curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/reminders`.

## Build roadmap

✅ = done · 🔲 = not started

### Phase 1 — Email & Auth
- 1.1 ✅ Custom email sending via Resend — domain verified (studytool.academy, eu-west-1), Supabase SMTP configured (smtp.resend.com:465), confirmation + password-reset templates customized
- 1.2 ✅ Account settings — change email and password fields on `/account` (client forms in `AccountActions.tsx` using `supabase.auth.updateUser`; email change triggers re-confirmation)
- 1.3 ✅ Password reset flow — "Forgot password?" link on login → `/forgot-password` → email → `/reset-password`; `auth/callback` detects `type=recovery` and redirects correctly
- 1.4 ✅ Email verification gate — `proxy.ts` checks `user.email_confirmed_at`, redirects unverified users to `/verify-email`; resend button calls `supabase.auth.resend()`
- 1.5 ✅ Google OAuth — Google Cloud OAuth client created, credentials added to Supabase → Authentication → Providers → Google; button on login + signup pages

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
- 3.8 🔲 Google AdSense integration for free-tier users — show non-intrusive banner ads; remove ads on upgrade (to be done last after all features complete)

### Phase 4 — Onboarding
- 4.1 ✅ Empty states — dashboard (dashed card + "Get started →" to /onboarding), course page (dashed card when no PDFs, info box when no plan yet), calendar (icon + "Get started →" to /onboarding)
- 4.2 ✅ First-time `/onboarding` wizard — 3 steps: create course → upload PDF (skippable) → create plan (skippable); redirects to /calendar on completion; server component skips wizard if user already has courses

### Phase 5 — Agenda / Blocked Days
- 5.1 ✅ `agenda_blocks` table — `id, user_id, date, title, created_at` with RLS; migration in `supabase/migration_agenda_blocks.sql`
- 5.2 ✅ Calendar UI — click an empty day cell to add/remove a personal block; shown in a distinct neutral colour
- 5.3 ✅ Scheduler integration — fetch blocks between start/exam date, treat blocked days as fully unavailable

### Phase 6 — Rescheduling
- 6.1 ✅ Highlight past days in plan view that still have pending topics; overdue banner on calendar + day view
- 6.2 ✅ "Reschedule remaining" button — redistributes all pending topics from today forward, respecting agenda blocks and other plans (`POST /api/plans/[id]/reschedule`); "reschedule all" on calendar
- 6.3 ✅ Single-topic reschedule — move one topic to next available slot (`POST /api/plan-items/[id]/reschedule`)

### Phase 7 — Notifications & Reminders
- 7.1 ✅ `notification_preferences` JSONB column on `profiles` (`migration_notifications.sql`); toggled on `/account` via `PATCH /api/account/notifications` (service-role, only touches that column)
- 7.2 ✅ Daily reminder email via Resend + Vercel cron — `GET /api/cron/reminders` (daily 06:00 UTC in `vercel.json`); groups today's pending topics per plan; templates in `src/lib/emails.ts`, send helper `src/lib/resend.ts`
- 7.3 ✅ Exam countdown email — same cron sends 3 days before exam date with remaining topic count; skips plans with nothing left

### Phase 8 — Study Experience
- 8.1 ✅ Topic chat — "Ask Claude" toggle per topic in day view (`TopicChat.tsx`); `GET`/`POST /api/topics/[id]/chat`; `chat_messages` table; Haiku, grounded on topic + document text; non-streaming for reliability. **Paid/dev only** (unbounded token usage) — free tier sees a lock + upgrade prompt, POST returns 403. Responses render as Markdown (`components/Markdown.tsx`, react-markdown — no raw HTML, XSS-safe). System prompt is jailbreak-hardened: stays on the study topic, refuses off-topic/role-change requests, and treats the uploaded document text as untrusted (ignores injected instructions).
  - **Tier map for study tools:** Summary = free · Ask Claude / Flashcards / Quizzes = paid+dev.
- 8.5 ✅ Per-topic study summary — "Summary" tool per topic (`TopicSummary.tsx`, `GET`/`POST /api/topics/[id]/summary`), free tier. A focused study write-up cached in `topics.study_guide` (shared with exam mode). Rendered as Markdown.
- 8.2 ✅ Exam mode — `/plans/[id]/exam-mode` page: condensed bullet revision notes per topic, generated in one Haiku call and cached in `topics.study_guide` (`POST /api/plans/[id]/exam-mode`). Linked from plan header when exam ≤3 days away
- 8.3 ✅ Progress analytics — `PlanStats` tiles on plan page: completion %, hours left, days to exam, study streak. Pure helpers in `src/lib/analytics.ts` (unit-tested); streak uses new `plan_items.completed_at` (stamped by the PATCH route)
- 8.4 ✅ Exam countdown badge — days-until-exam badge on plan header (red when ≤3 days); also surfaced in `PlanStats`

### Phase 9 — Flashcards & Quizzes (paid only)
- 9.1 ✅ `flashcards(id, topic_id, user_id, front, back, position)` and `quiz_questions(id, topic_id, user_id, question, options jsonb, correct_index, position)` tables (`migration_flashcards_quizzes.sql`, RLS per-user)
- 9.2 ✅ Haiku generates 6-8 flashcards + 5 quiz questions per topic on demand, cached in DB; `GET`/`POST /api/topics/[id]/flashcards` and `/quiz` (POST returns cached set if it exists; paid-gated via `requirePaidTopicAccess` in `src/lib/studyTools.ts`)
- 9.3 ✅ Day view — Flashcards (flip-card `FlashcardDeck.tsx`) and Quiz (scored `Quiz.tsx`) alongside Ask Claude, in `TopicStudyTools.tsx`
- 9.4 ✅ Free users see locked buttons (🔒) → in-panel upgrade prompt linking to `/account`; API also returns 403 for free tier

### Phase 10 — Deploy to Vercel
- 10.1 ✅ `npm run build` clean; no secrets prefixed `NEXT_PUBLIC_`
- 10.2 ✅ Unit tests for `planScheduler.ts` (Vitest) — `src/lib/planScheduler.test.ts`, 12 tests: scheduling, order, budget, overflow spreading, blocked days, conflict avoidance, edge cases. Run with `npm test`. Caught + fixed a UTC/local off-by-one in `addDays`/`daysBetween`.
- 10.3 ✅ GitHub Actions CI — `.github/workflows/ci.yml` runs lint + tests on every push/PR to main. (To gate Vercel deploys on green, set Vercel → Git → "Only deploy if CI passes" or an Ignored Build Step; see notes below.)
- 10.4 ✅ Connected GitHub repo to Vercel; all env vars set (Supabase, Anthropic, Stripe sandbox keys, Resend API key)
- 10.5 ◻ Supabase Site URL + Redirect URLs set to studytool.academy ✅; privacy/terms pages updated ✅; **Stripe live mode** still pending — see the "Stripe go-live checklist" above (config only, no code changes). **⏳ Blocked on obtaining a KvK number (Dutch CoC registration) before Stripe live activation — Sven TODO.**
- 10.6 ✅ Domain studytool.academy on Namecheap, pointed to Vercel (auto SSL), auto-renew on, contacts verified
- 10.7 ✅ Error logging / observability — `error_logs` table (`migration_error_logs.sql`, RLS-locked to service role); `src/lib/errorLog.ts` `logError()` helper (never throws); client boundaries `src/app/error.tsx` + `global-error.tsx` POST to `/api/errors`; server routes log via `logError` (e.g. upload extraction failure). View errors in Supabase → Table editor → `error_logs` (newest first).

### Phase 11 — UI Redesign (in progress, branch `ui-redesign`)
- 11.1 ✅ Solo with Claude (external contributor is out) — direction: **shadcn/ui** (base-nova/Base UI), clean & rounded, gradient accent (indigo→violet→fuchsia), NotebookLM-inspired, keep the existing sidebar.
- 11.2 ✅ All pages migrated to shadcn/ui + brand theme. Foundation: shadcn init, brand theme in `globals.css` (indigo `--primary`, `--radius` 0.85rem, `.bg-brand-gradient`/`.text-brand-gradient` utilities), gradient `Logo` + `icon.svg` favicon, mobile-responsive sidebar (`SidebarShell` → hamburger + drawer). Pages: landing, login, signup, forgot/reset/verify, topbar, sidebar, calendar, plan day view (two-column: topic list + study panel), course page (two-column + course tutor), dashboard (card grid), account, courses/new, onboarding, privacy, terms, loading skeletons. **Not yet merged to `main`** — verify on the `ui-redesign` branch, apply new migrations, then merge.

### Phase 12 — User Tutorial / Walkthrough
- 12.1 ✅ In-app "How it works" tutorial at `/tutorial` — a designed 5-step walkthrough of the full flow (create course → upload PDF → generate plan → study day-by-day → calendar), styled with the new theme; linked from the sidebar footer. New users (no courses) are pointed to `/onboarding` instead.
