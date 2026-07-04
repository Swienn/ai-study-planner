import { test, expect } from "@playwright/test";

// Note: the CTAs are shadcn <Button render={<Link/>}>, which renders as
// <a role="button" href="…">, so they're matched by role "button", not "link".
test.describe("Landing page", () => {
  test("renders the hero and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/day-by-day study plan/i);
    await expect(page.getByRole("button", { name: /get started free/i })).toBeVisible();
  });

  test("shows the three feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Upload anything")).toBeVisible();
    await expect(page.getByText("Conflict-aware schedule")).toBeVisible();
    await expect(page.getByText("Study smarter")).toBeVisible();
  });

  test('"Get started free" navigates to signup', async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /get started free/i }).click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('nav "Log in" navigates to login', async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation").getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
