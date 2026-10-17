import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("PromptPay EMVCo QR Settlement (E2E)", () => {
  test.beforeEach(async ({ context }) => {
    await loginAsTestUser(context);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  test("generates PromptPay EMVCo QR code and allows 1-tap settlement", async ({ page }) => {
    // 1. Clean storage before test run
    await page.goto("/setup");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    // 2. Setup and start a real match session
    await expect(page).toHaveURL("/setup");

    // Proceed through setup wizard
    await page.getByRole("button", { name: /proceed to players & rate/i }).click();
    await page.getByRole("button", { name: /start match session/i }).click();
    await expect(page).toHaveURL("/match");

    // Pot a red ball for Player 1 (Metha)
    const redBall = page.locator('button[aria-label*="Red ball"]');
    await redBall.click();
    await expect(page.getByText("×14")).toBeVisible();

    // End frame so scores are settled into runningBalance
    await page.locator('button[aria-label*="More options"]').click();
    const endFrameBtn = page.locator('button[aria-label*="End current frame"]');
    await expect(endFrameBtn).toBeVisible();
    await endFrameBtn.click();
    await page.getByRole("button", { name: /confirm end frame|ยืนยันจบเฟรม/i }).click();
    await expect(page.getByRole("heading", { name: /frame 1 complete/i })).toBeVisible();

    // 3. Navigate to settlement via client-side link
    const settlementNav = page.getByRole("link", { name: "เคลียร์เงิน" });
    await settlementNav.click();
    await expect(page).toHaveURL("/settlement");
    await expect(page.getByRole("heading", { name: /table settlement matrix/i })).toBeVisible();

    // Verify transfer row exists between Player 2 and Metha
    await expect(page.getByText("Metha", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Player 2", { exact: false }).first()).toBeVisible();

    // 4. Find and click PromptPay QR button on the transfer row
    const qrBtn = page.getByTitle("สร้าง QR พร้อมเพย์ สแกนจ่าย");
    await expect(qrBtn).toBeVisible();
    await qrBtn.click();

    // 5. Modal should open asking for recipient's (Metha's) PromptPay ID
    await expect(page.getByText(/PromptPay/i).first()).toBeVisible();
    await expect(page.getByText(/พร้อมเพย์ สแกนจ่าย/i)).toBeVisible();
    await expect(page.getByText(/ระบุเบอร์พร้อมเพย์ ของ Metha/i)).toBeVisible();

    // 6. Fill in mobile number and submit
    const input = page.locator("input[type='tel']");
    await expect(input).toBeVisible();
    await input.fill("081-234-5678");

    const submitQrBtn = page.getByRole("button", { name: /สร้าง QR โค้ด/i });
    await submitQrBtn.click();

    // 7. QR Code image should be generated and displayed
    const qrImg = page.locator("img[alt='PromptPay QR Code']");
    await expect(qrImg).toBeVisible();
    const src = await qrImg.getAttribute("src");
    expect(src).toContain("data:image/png;base64,");

    // 8. Verify PromptPay formatted number is displayed
    await expect(page.getByText("081-234-5678")).toBeVisible();

    // 9. Click "ยืนยันว่าจ่ายแล้ว (Mark as Paid)"
    const markPaidBtn = page.getByRole("button", { name: /ยืนยันว่าจ่ายแล้ว/i });
    await expect(markPaidBtn).toBeVisible();
    await markPaidBtn.click();

    // 10. Modal closes and transfer row reflects Paid state
    await expect(page.locator("img[alt='PromptPay QR Code']")).not.toBeVisible();
    await expect(page.getByRole("button", { name: /paid/i }).first()).toBeVisible();
    await expect(page.getByText("All Settled", { exact: true })).toBeVisible();
  });
});
