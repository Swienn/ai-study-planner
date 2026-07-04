import { test, expect } from "@playwright/test";

// Every authenticated route should bounce a logged-out visitor to /login —
// either via proxy.ts (protected prefixes) or a server-component redirect.
const protectedPaths = [
  "/calendar",
  "/dashboard",
  "/account",
  "/courses/new",
  "/onboarding",
  "/tutorial",
  "/plans/00000000-0000-0000-0000-000000000000",
];

test.describe("Protected routes redirect when logged out", () => {
  for (const path of protectedPaths) {
    test(`${path} → /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
