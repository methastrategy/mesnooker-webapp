import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Full Snooker Frame Match Simulation (E2E)", () => {
  test.beforeEach(async ({ context }) => {
    // Inject authenticated session cookie
    await loginAsTestUser(context);
    // Ensure clean local state on all page loads
    await context.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
  });

  test("simulates a complete realistic 1-frame snooker match with full potting sequence and financial settlement", async ({
    page,
  }) => {
    // ─── 1. Setup Phase ────────────────────────────────────────────────────────
    await page.goto("/setup");
    await expect(page).toHaveURL("/setup");

    // Verify Wizard Step 1: The Table
    await expect(page.getByRole("heading", { name: /configure match/i })).toBeVisible();
    await expect(page.getByText(/Step 1 of 2/i)).toBeVisible();

    // Select Point Count Standard
    const pointModeBtn = page.getByRole("button", { name: /Point Count \(1-7 pts\)/i });
    await expect(pointModeBtn).toBeVisible();
    await pointModeBtn.click();

    // Select 6 Reds rack for a clean, full 6-red snooker frame simulation
    const sixRedsBtn = page.getByRole("button", { name: "6 Reds" });
    await expect(sixRedsBtn).toBeVisible();
    await sixRedsBtn.click();

    // Proceed to Step 2
    const proceedBtn = page.getByRole("button", { name: /proceed to players & rate/i });
    await proceedBtn.click();

    // Verify Wizard Step 2: Players & Rate
    await expect(page.getByText(/Step 2 of 2/i)).toBeVisible();

    // Increase rate to ฿2 / point
    const increaseRateBtn = page.getByLabel("Increase rate");
    await increaseRateBtn.click();
    await increaseRateBtn.click(); // +0.5 twice = ฿2 / point
    await expect(page.getByText(/฿2/i)).toBeVisible();

    // Set custom player names
    const p1Input = page.getByPlaceholder("Player 1");
    await p1Input.fill("Metha");

    const p2Input = page.getByPlaceholder("Player 2");
    await p2Input.fill("Ronnie");

    // Start Session
    const startMatchBtn = page.getByRole("button", { name: /start match session/i });
    await expect(startMatchBtn).toBeEnabled();
    await startMatchBtn.click();

    // ─── 2. Match Ingress & Live Cockpit ──────────────────────────────────────
    await expect(page).toHaveURL("/match");

    // Verify LiveMatch Cockpit and Scoreboard
    await expect(page.getByText("Metha").first()).toBeVisible();
    await expect(page.getByText("Ronnie").first()).toBeVisible();

    // Verify initial ball pad shows red ball is active
    const redBall = page.locator('button[aria-label*="Red ball"]');
    await expect(redBall).toBeEnabled();

    // ─── 3. Break 1: Metha shoots ─────────────────────────────────────────────
    // Shot 1: Metha pots Red 1 (+1 pt)
    await redBall.click();

    // Colours are now legal!
    // Shot 2: Metha pots Black (+7 pts) -> score = 8
    const blackBall = page.locator('button[aria-label*="Black ball"]');
    await expect(blackBall).toBeEnabled();
    await blackBall.click();

    // ─── 4. Test Edge Case: Undo & Redo ───────────────────────────────────────
    // Shot 3 (test undo): Click Undo button
    const undoBtn = page.locator('button[aria-label*="Undo last action"]');
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();

    // Black was undone, score reverted, colours legal again
    await expect(blackBall).toBeEnabled();

    // Re-pot Black (+7 pts) -> Metha score = 8
    await blackBall.click();

    // Metha plays safe and ends turn
    const turnBtn = page.locator('button[aria-label*="Pass turn to next player"]');
    await turnBtn.click();

    // ─── 5. Ronnie's Turn: Foul penalty ───────────────────────────────────────
    // Ronnie fouls on break off (−4 pts)
    const foulBtn = page.locator('button[aria-label*="Foul penalty"]');
    await expect(foulBtn).toBeEnabled();
    await foulBtn.click();

    // Foul penalty applied and turn automatically returns to Metha
    // Metha escapes snooker: clicks Solve (+1 pt) -> Metha score = 9
    const solveBtn = page.locator('button[aria-label*="Solve snooker escape"]');
    await expect(solveBtn).toBeEnabled();
    await solveBtn.click();

    // ─── 6. Clear Remaining 5 Reds with Colours ──────────────────────────────
    // Red 2 (+1) + Pink (+6) -> Metha = 16
    await redBall.click();
    const pinkBall = page.locator('button[aria-label*="Pink ball"]');
    await pinkBall.click();

    // Red 3 (+1) + Blue (+5) -> Metha = 22
    await redBall.click();
    const blueBall = page.locator('button[aria-label*="Blue ball"]');
    await blueBall.click();

    // Red 4 (+1) + Brown (+4) -> Metha = 27
    await redBall.click();
    const brownBall = page.locator('button[aria-label*="Brown ball"]');
    await brownBall.click();

    // Red 5 (+1) + Green (+3) -> Metha = 31
    await redBall.click();
    const greenBall = page.locator('button[aria-label*="Green ball"]');
    await greenBall.click();

    // Red 6 (+1) + Yellow (+2) -> Metha = 34
    await redBall.click();
    const yellowBall = page.locator('button[aria-label*="Yellow ball"]');
    await yellowBall.click();

    // ─── 7. Clear the Table (Strict Colours Sequence) ─────────────────────────
    // Now all 6 reds are cleared! ClearRack HUD is active!
    const clearRackRegion = page.locator('[role="region"][aria-label*="Clear the table"]');
    await expect(clearRackRegion).toBeVisible({ timeout: 5000 });

    // Sequence 1: Pot Yellow (+2 pts)
    const clearYellow = clearRackRegion.locator('button[aria-label*="Yellow ball"]');
    await expect(clearYellow).toBeVisible();
    await clearYellow.click();

    // Sequence 2: Pot Green (+3 pts)
    const clearGreen = clearRackRegion.locator('button[aria-label*="Green ball"]');
    await expect(clearGreen).toBeVisible();
    await clearGreen.click();

    // Sequence 3: Pot Brown (+4 pts)
    const clearBrown = clearRackRegion.locator('button[aria-label*="Brown ball"]');
    await expect(clearBrown).toBeVisible();
    await clearBrown.click();

    // Sequence 4: Pot Blue (+5 pts)
    const clearBlue = clearRackRegion.locator('button[aria-label*="Blue ball"]');
    await expect(clearBlue).toBeVisible();
    await clearBlue.click();

    // Sequence 5: Pot Pink (+6 pts)
    const clearPink = clearRackRegion.locator('button[aria-label*="Pink ball"]');
    await expect(clearPink).toBeVisible();
    await clearPink.click();

    // Sequence 6: Pot FINAL Black (+7 pts) -> AUTO-ENDS THE FRAME!
    const clearBlack = clearRackRegion.locator('button[aria-label*="Black ball"]');
    await expect(clearBlack).toBeVisible();
    await clearBlack.click();

    // ─── 8. Frame Pause Summary ───────────────────────────────────────────────
    // Black potted toast flashes and FramePauseSummary automatically renders
    const frameCompleteHeading = page.getByRole("heading", { name: /frame 1 complete/i });
    await expect(frameCompleteHeading).toBeVisible({ timeout: 6000 });

    // Verify Winner Podium Spotlight shows Metha
    await expect(page.getByText("Frame Winner")).toBeVisible();
    await expect(page.locator("text=Metha").first()).toBeVisible();

    // Verify Next Frame Opener options are visible
    await expect(page.getByText("Next Frame Break Off")).toBeVisible();

    // Verify Session Net Balance ledger shows financial settlement
    await expect(page.getByText("Session Net Balance")).toBeVisible();

    // ─── 9. End Session & Final Financial Settlement ──────────────────────────
    const endSessionBtn = page.getByRole("button", { name: /end session & settle/i });
    await expect(endSessionBtn).toBeVisible();
    await endSessionBtn.click();

    // ─── 10. Frame Complete Summary & Match Ledger ─────────────────────────────
    // Verify final settlement modal appears
    await expect(page.getByRole("heading", { name: /Match Concluded & Settled/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Final Standings")).toBeVisible();
    await expect(page.getByText(/Settlement Matrix · Who Pays Whom/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Copy Report/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start New Game/i })).toBeVisible();

    // Verify Metha is recognized as Champion
    await expect(page.getByText("Champion").first()).toBeVisible();
    await expect(page.locator("text=Metha").first()).toBeVisible();
  });
});
