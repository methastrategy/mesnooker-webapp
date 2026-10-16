import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Manual End Frame & Resume Safety (E2E)", () => {
  test.beforeEach(async ({ context }) => {
    await loginAsTestUser(context);
    await context.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
  });

  test("supports manual frame conclusion, resume on accident, and next frame transition", async ({
    page,
  }) => {
    await page.goto("/setup");

    // Start a quick 15-red session
    await page.getByRole("button", { name: /proceed to players & rate/i }).click();
    await page.getByRole("button", { name: /start match session/i }).click();
    await expect(page).toHaveURL("/match");

    // Pot one red ball
    const redBall = page.locator('button[aria-label*="Red ball"]');
    await redBall.click();
    await expect(page.getByText("×14")).toBeVisible();

    // Player accidentally clicks "End" frame on the dock
    const endFrameDockBtn = page.locator('button[aria-label*="End current frame"]');
    await expect(endFrameDockBtn).toBeVisible();
    await endFrameDockBtn.click();

    // FramePauseSummary appears with "Resume Frame" safety button
    const resumeBtn = page.getByRole("button", { name: /resume frame/i });
    await expect(resumeBtn).toBeVisible();

    // Click Resume Frame -> Cockpit is restored with state intact!
    await resumeBtn.click();
    await expect(page.getByText("×14")).toBeVisible();

    // End frame for real
    await endFrameDockBtn.click();
    await expect(page.getByRole("heading", { name: /frame 1 complete/i })).toBeVisible();

    // Test "Next Frame" button
    const nextFrameBtn = page.getByRole("button", { name: /next frame/i });
    await expect(nextFrameBtn).toBeVisible();
    await nextFrameBtn.click();

    // Frame 2 has started! Rack is re-initialized with 15 reds and F2 header clock is shown
    await expect(page.getByText("×15")).toBeVisible();
    await expect(page.getByText(/F2:/)).toBeVisible();
  });
});
