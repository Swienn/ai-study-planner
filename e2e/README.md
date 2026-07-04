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

Wired into `.github/workflows/ci.yml` as the **`e2e`** job — it runs alongside
lint + unit tests on every push/PR to `main`. The job self-skips (stays green)
unless the Supabase config is present, so it never blocks a merge before the
secrets are set.

Add these under **GitHub → Settings → Secrets and variables → Actions →
Secrets** (repository secrets):

| Secret | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | the job to run at all (dev server boot) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same |
| `TEST_USER_EMAIL` | the authenticated specs (skipped otherwise) |
| `TEST_USER_PASSWORD` | same |

Use a throwaway account with a **confirmed** email. Without the first two the
whole job skips; without the last two only the authenticated specs skip.
