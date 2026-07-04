import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

// These run only when a test account is provided (see e2e/README.md). Use a
// throwaway / dev account — the create-course test writes and cleans up data.
test.describe("Authenticated flows", () => {
  test.skip(!email || !password, "Set TEST_USER_EMAIL / TEST_USER_PASSWORD to run authenticated e2e");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/calendar/, { timeout: 20_000 });
  });

  test("calendar loads with the sidebar", async ({ page }) => {
    await expect(page.getByText("COURSES")).toBeVisible();
    await expect(page.getByRole("link", { name: "Calendar" })).toBeVisible();
  });

  test("account page shows the current plan", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
    await expect(page.getByText("Current plan")).toBeVisible();
    await expect(page.getByText("Change email")).toBeVisible();
  });

  test('"How it works" opens the tutorial', async ({ page }) => {
    await page.getByRole("link", { name: /how it works/i }).click();
    await expect(page).toHaveURL(/\/tutorial/);
    await expect(page.getByRole("heading", { name: /a clear study plan/i })).toBeVisible();
    await expect(page.getByText("Create a course")).toBeVisible();
  });

  test("create a course, see it, then delete it", async ({ page }) => {
    const name = `E2E course ${Date.now()}`;
    await page.goto("/courses/new");
    await page.getByLabel("Course name").fill(name);
    await page.getByRole("button", { name: "Create course" }).click();

    await expect(page).toHaveURL(/\/courses\/[0-9a-f-]+/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name })).toBeVisible();

    // Cleanup — remove the course we just created.
    await page.getByRole("button", { name: "Delete course" }).click();
    await page.getByRole("button", { name: /yes, delete/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });
});
