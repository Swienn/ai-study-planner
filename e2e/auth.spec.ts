import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("renders the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  });

  test("links to signup", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("shows an error on wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password-123");
    await page.getByRole("button", { name: "Log in" }).click();
    // Supabase returns "Invalid login credentials" (or similar) — a visible error appears.
    await expect(page.locator("p.text-destructive")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Signup page", () => {
  test("renders the form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  });

  test("validates password mismatch inline", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("different456");
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("links to login", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("Forgot password page", () => {
  test("renders and links back to login", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible();
    await page.getByRole("link", { name: /back to log in/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
