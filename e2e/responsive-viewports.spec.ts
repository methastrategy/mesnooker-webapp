import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("UI/UX Multi-Device Viewports & Ergonomics (E2E)", () => {
  test.beforeEach(async ({ context }) => {
    await loginAsTestUser(context);
    await context.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
  });

  test("iPhone SE 2 (375x667): zero setup horizontal overflow, hidden bottom nav, large bump buttons, and FramePauseSummary scrollability", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // ─── 1. Setup Page Verification on iPhone SE 2 ───
    await page.goto("/setup");
    await expect(page).toHaveURL("/setup");

    // Zero horizontal overflow on Setup page
    const setupOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(setupOverflow).toBe(false);

    // BottomNav must be hidden on /setup to reclaim vertical space
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await expect(bottomNav).toHaveCount(0);

    // Proceed to Step 2
    await page.getByRole("button", { name: /proceed to players & rate/i }).click();

    // Check player bump buttons touch target size (>= 36px)
    const addPlayerBtn = page.getByLabel("Add player");
    const bumpBox = await addPlayerBtn.boundingBox();
    expect(bumpBox).not.toBeNull();
    expect(bumpBox!.height).toBeGreaterThanOrEqual(36);
    expect(bumpBox!.width).toBeGreaterThanOrEqual(36);

    // Setup a standard 2-player match
    await page.getByRole("button", { name: /start match session/i }).click();
    await expect(page).toHaveURL("/match");

    // ─── 2. BallPad on iPhone SE 2 (375px) ───
    // Check that table container has zero horizontal overflow
    const matchOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(matchOverflow).toBe(false);

    // ─── 3. FramePauseSummary Scroll Lock Fix on iPhone SE 2 ───
    // End frame manually to enter FramePauseSummary
    const endFrameDockBtn = page.locator('button[aria-label*="End current frame"]');
    await expect(endFrameDockBtn).toBeVisible();
    await endFrameDockBtn.click();

    // Pause summary modal is visible
    await expect(page.getByRole("heading", { name: /frame 1 complete/i })).toBeVisible();

    // Verify the scrollable container is scrollable
    const scrollContainer = page.locator(".overflow-y-auto");
    await expect(scrollContainer).toBeVisible();

    // Check scrollHeight is greater than clientHeight on compact 667px screen
    const isScrollable = await scrollContainer.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(isScrollable).toBe(true);

    // Scroll down to the bottom
    await scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Verify "Next Frame" and "End Session & Settle" buttons are reachable and clickable
    const nextFrameBtn = page.getByRole("button", { name: /next frame/i });
    await expect(nextFrameBtn).toBeVisible();
    const endSessionBtn = page.getByRole("button", { name: /end session & settle/i });
    await expect(endSessionBtn).toBeVisible();

    // Click Next Frame and verify transition to Frame 2
    await nextFrameBtn.click();
    await expect(page.getByText(/F2:/)).toBeVisible();
  });

  test("iPad Landscape (1024x768) & Desktop (1280x800): 4-player opponent card names clientWidth > 60px", async ({
    page,
  }) => {
    // Test iPad Landscape
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.goto("/setup");
    await page.getByRole("button", { name: /proceed to players & rate/i }).click();

    // Add 2 more players to make it 4 players
    const addPlayerBtn = page.getByLabel("Add player");
    await addPlayerBtn.click();
    await addPlayerBtn.click();
    await expect(page.getByText("Players Roster (4)")).toBeVisible();

    // Fill nicknames
    await page.getByPlaceholder("Player 1").fill("Metha_Pro");
    await page.getByPlaceholder("Player 2").fill("Oum_Sniper");
    await page.getByPlaceholder("Player 3").fill("Folk_Master");
    await page.getByPlaceholder("Player 4").fill("Non_Break");

    await page.getByRole("button", { name: /start match session/i }).click();
    await expect(page).toHaveURL("/match");

    // Verify zero horizontal layout blowout
    const landscapeOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(landscapeOverflow).toBe(false);

    // Inspect the 3 opponent cards' nickname elements
    const opponentNicknames = page.locator('div[class*="landscape:grid-cols-1"] a span.truncate, div[class*="landscape:flex-row"] a span.truncate');
    const count = await opponentNicknames.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const clientWidth = await opponentNicknames.nth(i).evaluate((el) => el.clientWidth);
      // Nickname clientWidth must be strictly > 60px (no crushed 0px or 55px cards)
      expect(clientWidth).toBeGreaterThan(60);
    }

    // Now test Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    for (let i = 0; i < count; i++) {
      const clientWidth = await opponentNicknames.nth(i).evaluate((el) => el.clientWidth);
      expect(clientWidth).toBeGreaterThan(60);
    }
  });

  test("Home Stake Calculator & Settlement Button Ergonomics", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");

    // Check Quick Stake Calculator chips touch targets (min-h-[40px])
    const stakeChip = page.getByRole("button", { name: /10\s*(?:แต้ม|ลูก|pt|b)/i }).first();
    await expect(stakeChip).toBeVisible();
    const chipBox = await stakeChip.boundingBox();
    expect(chipBox).not.toBeNull();
    expect(chipBox!.height).toBeGreaterThanOrEqual(38);

    // Navigate to settlement
    await page.goto("/settlement");
    await expect(page).toHaveURL("/settlement");

    // In empty settlement, container renders cleanly
    await expect(page.getByRole("heading", { name: /Table Settlement Matrix/i })).toBeVisible();
    await expect(page.getByText(/No active session or match history found/i)).toBeVisible();
  });
});
