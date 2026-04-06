# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
│   │   ├── auth/signout/         → POST sign out
│   │   ├── courses/              → GET list, POST create
│   │   ├── courses/[id]/         → GET detail, DELETE
│   │   ├── documents/[id]/       → DELETE (also removes from storage)
│   │   ├── documents/upload/     → POST upload PDF + Claude extraction
│   │   ├── plan-items/[id]/      → PATCH status (pending/completed/skipped)
│   │   ├── plans/                → POST create plan
│   │   └── plans/[id]/           → DELETE
│   ├── auth/callback/            → email confirmation handler
│   ├── calendar/                 → full calendar view (all courses)
│   ├── courses/
│   │   ├── new/                  → create course form
│   │   └── [id]/                 → course detail, upload PDFs, create plan
│   ├── dashboard/                → course cards, uncategorised docs/plans
│   ├── plans/[id]/               → day-by-day plan view, progress tracking
│   ├── login/ signup/            → auth pages
│   └── page.tsx                  → landing page
├── lib/
│   ├── anthropic.ts              → Anthropic client (server-side only)
│   ├── planScheduler.ts          → pure scheduling logic, no DB imports
│   └── supabase/
│       ├── client.ts             → browser client (use in "use client" components)
│       └── server.ts             → server client (use in API routes + server components)
└── proxy.ts                      → auth proxy, protects /dashboard /courses /plans /calendar
```

### Database schema

```
courses       id, user_id, title, color
documents     id, user_id, course_id(nullable), filename, raw_text
topics        id, document_id, title, summary, difficulty(1-3), position
plans         id, user_id, course_id(nullable), title, exam_date, hours_per_day
plan_documents plan_id, document_id
plan_items    id, plan_id, topic_id, date, status(pending/completed/skipped)
```

All tables have RLS — users can only access their own rows.

`course_id` is nullable on `documents` and `plans` for backwards compatibility with pre-course uploads.

### Key patterns

**Auth in API routes** — always use `supabase.auth.getUser()` (validates JWT server-side), never `getSession()`:
```ts
const supabase = await createClient(); // from @/lib/supabase/server
const { data: { user } } = await supabase.auth.getUser();
if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

**PDF upload security** — validate magic bytes (`%PDF` = `0x25 0x50 0x44 0x46`), not just MIME type. Create two independent `Buffer.from(arrayBuffer.slice(0))` copies before passing to pdf-parse — pdfjs-dist detaches the ArrayBuffer it receives, which corrupts the storage upload.

**Scheduling** — `src/lib/planScheduler.ts` takes `topicIds`, `startDateStr`, `examDateStr`, `hoursPerDay`, and a `Map<date, existingCount>` of already-scheduled items. Works only with `YYYY-MM-DD` strings to avoid timezone issues. The API fetches existing load from all user plans before calling it.

**Supabase nested joins** — avoid deep joins with `select("a, b(c(d))")` — they silently return null for ambiguous FKs. Fetch separately and join in JS instead.

**Tailwind dynamic classes** — use complete class name strings in lookup objects, never template literals like `` `bg-${color}-500` ``.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
```

## Planned features (not yet built)

These should be kept in mind when making architectural decisions:

- **Rescheduling** — drag topics to a different day, or auto-reschedule remaining topics after a missed day
- **Topic chat** — ask Claude questions about a specific topic in context of the uploaded documents (needs `ChatMessage` table: `id, topic_id, role, content, created_at`)
- **Exam mode** — final review day before exam: shows all topics as a quick-scan summary
- **Progress analytics** — completion rate per course, streak tracking, estimated hours remaining
- **Freemium / Stripe** — free tier (limited plans/month), Premium Student (€7.99–12.99/month), Semester Pass (€19.99–29.99)
- **Google OAuth** — add alongside email/password auth via Supabase Auth
- **Vercel deployment** — not yet done; add env vars to Vercel dashboard when ready
- **Adaptive replanning** — when a topic is marked skipped, offer to push it to the next available slot
- **B2B / coach dashboard** — multiple student seats, progress overview for study coaches
