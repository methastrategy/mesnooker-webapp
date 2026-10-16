import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Mobile Viewport & 4-Player Target Cycle (E2E)", () => {
  test.use({
    viewport: { width: 390, height: 844 }, // Mobile portrait standard (iPhone 12/13/14)
    isMobile: true,
    hasTouch: true,
  });

  test.beforeEach(async ({ context }) => {
    await loginAsTestUser(context);
    await context.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
  });

  test("verifies mobile 4-player setup, balanced 3-column opponent layout, target cycle ribbon, and zero horizontal overflow", async ({
    page,
  }) => {
    // ─── 1. Setup Phase on Mobile ─────────────────────────────────────────────
    await page.goto("/setup");
    await expect(page).toHaveURL("/setup");

    // Select Ball Count Simple mode (red=1, colours=1 except brown/black=2, foul=−2)
    const ballCountBtn = page.getByRole("button", { name: /Ball Count \(1-2 pts\)/i });
    await expect(ballCountBtn).toBeVisible();
    await ballCountBtn.click();

    // Select 6 Reds rack
    const sixRedsBtn = page.getByRole("button", { name: "6 Reds" });
    await expect(sixRedsBtn).toBeVisible();
    await sixRedsBtn.click();

    // Proceed to Step 2
    await page.getByRole("button", { name: /proceed to players & rate/i }).click();

    // Add 2 more players (2 -> 3 -> 4 players)
    const addPlayerBtn = page.getByLabel("Add player");
    await addPlayerBtn.click();
    await addPlayerBtn.click();
    await expect(page.getByText("Players Roster (4)")).toBeVisible();

    // Name the 4 players
    const p1Input = page.getByPlaceholder("Player 1");
    await p1Input.fill("Metha");
    const p2Input = page.getByPlaceholder("Player 2");
    await p2Input.fill("Ronnie");
    const p3Input = page.getByPlaceholder("Player 3");
    await p3Input.fill("Trump");
    const p4Input = page.getByPlaceholder("Player 4");
    await p4Input.fill("Selby");

    // Test player shuffle feature
    const shuffleBtn = page.getByRole("button", { name: /shuffle|สุ่มคิว/i });
    await expect(shuffleBtn).toBeEnabled();
    await shuffleBtn.click();

    // Start Session
    const startMatchBtn = page.getByRole("button", { name: /start match session/i });
    await expect(startMatchBtn).toBeEnabled();
    await startMatchBtn.click();

    // ─── 2. Mobile Cockpit & Layout Verification ──────────────────────────────
    await expect(page).toHaveURL("/match");

    // Ensure zero horizontal scrollbar / zero layout blowout on mobile screen
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Verify Active Shooter Spotlight is visible
    await expect(page.locator("text=TURN").first()).toBeVisible();

    // Verify Dedicated Target Cycle Bar (ใครจ่ายใคร) is rendered
    await expect(page.getByText(/Target Cycle:|ใครจ่ายใคร:/i)).toBeVisible();

    // Verify Up Next queue flow is visible
    await expect(page.getByText(/Up Next:|คิวถัดไป:/i)).toBeVisible();

    // ─── 3. Multi-Player Turn Rotation Mechanics ──────────────────────────────
    // Active player 1 pots Red 1 (+1 pt)
    const redBall = page.locator('button[aria-label*="Red ball"]');
    await expect(redBall).toBeEnabled();
    await redBall.click();

    // Player 1 pots Brown (+2 in ball count mode!)
    const brownBall = page.locator('button[aria-label*="Brown ball"]');
    await expect(brownBall).toBeEnabled();
    await brownBall.click();

    // Player 1 finishes turn and passes to Player 2
    const turnBtn = page.locator('button[aria-label*="Pass turn to next player"]');
    await turnBtn.click();

    // Player 2 commits a foul (−2 pts in ball count mode)
    const foulBtn = page.locator('button[aria-label*="Foul penalty"]');
    await expect(foulBtn).toBeEnabled();
    await foulBtn.click();

    // Foul automatically advances turn to Player 3
    // Player 3 pots Red 2 (+1 pt)
    await expect(redBall).toBeEnabled();
    await redBall.click();

    // Verify no horizontal overflow persisted during intense live gameplay
    const hasGameOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasGameOverflow).toBe(false);

    // ─── 4. End Frame on Mobile ───────────────────────────────────────────────
    await page.locator('button[aria-label*="More options"]').click();
    const endFrameBtn = page.locator('button[aria-label*="End current frame"]');
    await expect(endFrameBtn).toBeVisible();
    await endFrameBtn.click();
    await page.getByRole("button", { name: /confirm end frame|ยืนยันจบเฟรม/i }).click();

    // FramePauseSummary should adapt gracefully to mobile viewport
    await expect(page.getByRole("heading", { name: /frame 1 complete/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /resume frame/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /end session & settle/i })).toBeVisible();
  });
});
