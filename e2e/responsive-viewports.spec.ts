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
    const ballPadScroll = page.locator('div.w-full.overflow-x-auto.no-scrollbar');
    const ballPadMetrics = await ballPadScroll.evaluate((el) => {
      const row = el.firstElementChild as HTMLElement;
      const children = Array.from(row.children).map((c) => {
        const h = c as HTMLElement;
        const ball = h.querySelector('button') as HTMLElement;
        const badge = h.querySelector('div') as HTMLElement;
        return {
          colWidth: h.offsetWidth,
          ballWidth: ball?.offsetWidth,
          badgeWidth: badge?.offsetWidth,
          badgeText: badge?.innerText?.replace(/\n/g, ' '),
        };
      });
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        rowGap: window.getComputedStyle(row).gap,
        children,
      };
    });
    console.log("BALLPAD_METRICS_375:", JSON.stringify(ballPadMetrics, null, 2));

    // Check that BallPad has zero horizontal overflow/drag on 375px
    expect(ballPadMetrics.scrollWidth).toBeLessThanOrEqual(ballPadMetrics.clientWidth);

    // Check that table container has zero horizontal overflow
    const matchOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(matchOverflow).toBe(false);

    // ─── 3. FramePauseSummary Scroll Lock Fix on iPhone SE 2 ───
    // End frame manually to enter FramePauseSummary
    await page.locator('button[aria-label*="More options"]').click();
    const endFrameBtn = page.locator('button[aria-label*="End current frame"]');
    await expect(endFrameBtn).toBeVisible();
    await endFrameBtn.click();
    await page.getByRole("button", { name: /confirm end frame|ยืนยันจบเฟรม/i }).click();

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

  test("Compact Mobile (360x640) & iPhone SE 2 Landscape (667x375): zero horizontal drag and overflow", async ({
    page,
  }) => {
    // 360x640 viewport (Galaxy S8 / small Android)
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/setup");
    await page.getByRole("button", { name: /proceed to players & rate/i }).click();
    await page.getByRole("button", { name: /start match session/i }).click();
    await expect(page).toHaveURL("/match");

    const ballPad360 = page.locator("div.w-full.overflow-x-auto.no-scrollbar");
    const metrics360 = await ballPad360.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(metrics360.scrollWidth).toBeLessThanOrEqual(metrics360.clientWidth);

    // iPhone SE 2 Landscape (667x375)
    await page.setViewportSize({ width: 667, height: 375 });
    const landscape375Overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(landscape375Overflow).toBe(false);
  });

  test("iPad Landscape (1024x768) & Desktop (1280x800) & Ultra-Wide (1920x1080): opponent cards and container scaling", async ({
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

    // Now test Ultra-Wide Desktop (1920x1080) for 2xl:max-w-7xl scaling
    await page.setViewportSize({ width: 1920, height: 1080 });
    const mainContainer = page.locator("main > div");
    const mainBox = await mainContainer.boundingBox();
    expect(mainBox).not.toBeNull();
    // 2xl:max-w-7xl is 80rem = 1280px (with 16px root font size)
    expect(mainBox!.width).toBeCloseTo(1280, -1);
  });

  test("Home Stake Calculator & Settlement Button Ergonomics (Pay & Copy >= 36-40px)", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");

    // Check Quick Stake Calculator chips touch targets (min-h-[40px])
    const stakeChip = page.getByRole("button", { name: /10\s*(?:แต้ม|ลูก|pt|b)/i }).first();
    await expect(stakeChip).toBeVisible();
    const chipBox = await stakeChip.boundingBox();
    expect(chipBox).not.toBeNull();
    expect(chipBox!.height).toBeGreaterThanOrEqual(38);

    // Seed match history with outstanding debt to render SettlementPanel Pay & Copy buttons
    await page.addInitScript(() => {
      const state = {
        state: {
          history: [
            {
              id: "archived-e2e-settlement",
              startedAt: Date.now() - 3600000,
              endedAt: Date.now(),
              players: [
                { id: "p1", nickname: "Metha", avatar: "🎱", color: "red" },
                { id: "p2", nickname: "Oum", avatar: "🍀", color: "yellow" }
              ],
              rawBalances: { p1: 100, p2: -100 },
              balances: { p1: 100, p2: -100 },
              mode: "balls",
              moneyRate: 10,
              moneyPer: "ball",
              tableFee: 0,
              redCount: 15,
              frames: 1,
              totalPoints: 50
            }
          ],
          paidTransfers: []
        },
        version: 1
      };
      try {
        localStorage.setItem("smoke-master-v1", JSON.stringify(state));
      } catch {}
    });

    // Navigate to settlement
    await page.goto("/settlement");
    await expect(page).toHaveURL("/settlement");

    // Pay button touch target check (>= 36px height and width)
    const payBtn = page.getByRole("button", { name: /^pay$/i });
    await expect(payBtn).toBeVisible();
    const payBox = await payBtn.boundingBox();
    expect(payBox).not.toBeNull();
    expect(payBox!.height).toBeGreaterThanOrEqual(36);
    expect(payBox!.width).toBeGreaterThanOrEqual(36);

    // Copy transfer button touch target check (>= 36px height and width)
    const copyBtn = page.getByRole("button", { name: /copy\s+oum\s*→\s*metha/i });
    await expect(copyBtn).toBeVisible();
    const copyBox = await copyBtn.boundingBox();
    expect(copyBox).not.toBeNull();
    expect(copyBox!.height).toBeGreaterThanOrEqual(36);
    expect(copyBox!.width).toBeGreaterThanOrEqual(36);

    // Mark paid interactive flow
    await payBtn.click();
    await expect(page.getByRole("button", { name: /^paid$/i })).toBeVisible();
  });
});
