import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Authentication Gate & Navigation", () => {
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    // Navigate to protected page
    await page.goto("/setup");
    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(page.locator("#login-username")).toBeVisible();
    await expect(page.locator("#login-pass")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("authenticated user can access homepage and setup", async ({ page, context }) => {
    // Inject valid session cookie
    await loginAsTestUser(context);

    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.locator("h1").first()).toBeVisible();

    await page.goto("/setup");
    await expect(page).toHaveURL("/setup");
    await expect(page.getByRole("heading", { name: /new game/i })).toBeVisible();
  });
});
