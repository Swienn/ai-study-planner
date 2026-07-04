# End-to-end tests (Playwright)

Browser tests that drive the real app. Config: `playwright.config.ts`.

## Running

```bash
npm run test:e2e          # headless, starts (or reuses) the dev server
npm run test:e2e:ui       # interactive UI mode
npx playwright show-report  # open the last HTML report
```

Playwright starts `npm run dev` automatically (and reuses an already-running
dev server locally). The dev server reads `.env.local`, so Supabase must be
reachable.

## What's covered

- **`landing.spec.ts`**, **`auth.spec.ts`** — public pages: rendering, form
  validation (password mismatch), navigation between login/signup/forgot, and a
  wrong-credentials error. No auth needed; always run.
- **`protected.spec.ts`** — every authenticated route redirects a logged-out
  visitor to `/login`.
- **`authenticated.spec.ts`** — login + calendar/account/tutorial + a
  create-course→verify→delete flow. **Skipped unless** a test account is set:

  ```bash
  TEST_USER_EMAIL="you@example.com" TEST_USER_PASSWORD="…" npm run test:e2e
  ```

  Use a throwaway/dev account with a **confirmed email** — the create-course
  test writes and then cleans up a course. It does NOT upload PDFs (avoids
  Claude cost / flakiness).

## CI

Not wired into `.github/workflows/ci.yml` yet. To add it, create a job that:
1. `npm ci` → `npx playwright install --with-deps chromium`
2. sets `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (repo
   variables — they're public), and optionally `TEST_USER_EMAIL/PASSWORD`
   (secrets) to also run the authenticated specs
3. `npm run test:e2e`
