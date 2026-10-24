import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Guest Mode Access & Authentication Gate", () => {
  test("unauthenticated guest user can access core pages directly without login redirect", async ({ page }) => {
    // 1. Homepage access
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.locator("h1").first()).toBeVisible();

    // 2. Setup page access
    await page.goto("/setup");
    await expect(page).toHaveURL("/setup");
    await expect(page.getByRole("heading", { name: /new game/i })).toBeVisible();

    // 3. Match page access
    await page.goto("/match");
    await expect(page).toHaveURL("/match");

    // 4. Settlement page access
    await page.goto("/settlement");
    await expect(page).toHaveURL("/settlement");
  });

  test("unauthenticated request to protected API endpoint returns 401 unauthorized", async ({ request }) => {
    const res = await request.get("/api/unknown-protected-endpoint");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  test("authenticated user can access homepage and is bounced away from /login", async ({ page, context }) => {
    // Inject valid session cookie
    await loginAsTestUser(context);

    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.locator("h1").first()).toBeVisible();

    // Authenticated user navigating to /login should be bounced to /
    await page.goto("/login");
    await expect(page).toHaveURL(/\/$/);
  });
});
