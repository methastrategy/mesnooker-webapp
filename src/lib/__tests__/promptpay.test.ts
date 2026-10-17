import { describe, it, expect } from "vitest";
import {
  crc16,
  validatePromptPayTarget,
  generatePromptPayPayload,
  generatePromptPayQrDataUrl,
} from "../promptpay";

describe("promptpay - EMVCo QR Code generator", () => {
  it("calculates standard CRC16-CCITT correctly", () => {
    // Known test vector for CRC16-CCITT (0xFFFF, 0x1021)
    expect(crc16("123456789")).toBe("29B1");
  });

  describe("validatePromptPayTarget", () => {
    it("validates 10-digit Thai mobile number", () => {
      const res = validatePromptPayTarget("081-234-5678");
      expect(res.valid).toBe(true);
      expect(res.type).toBe("mobile");
      expect(res.sanitized).toBe("0812345678");
      expect(res.formatted).toBe("081-234-5678");
    });

    it("validates 13-digit Thai national ID", () => {
      const res = validatePromptPayTarget("1-1002-00345-67-8");
      expect(res.valid).toBe(true);
      expect(res.type).toBe("nationalId");
      expect(res.sanitized).toBe("1100200345678");
      expect(res.formatted).toBe("1-1002-00345-67-8");
    });

    it("rejects invalid input length", () => {
      const res = validatePromptPayTarget("12345");
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });

    it("rejects empty or non-string input", () => {
      const res = validatePromptPayTarget("");
      expect(res.valid).toBe(false);
    });
  });

  describe("generatePromptPayPayload", () => {
    it("generates valid EMVCo payload for mobile number with amount", () => {
      const payload = generatePromptPayPayload("0812345678", 100);
      expect(payload).toContain("000201"); // Tag 00
      expect(payload).toContain("010212"); // Tag 01 dynamic
      expect(payload).toContain("A000000677010111"); // PromptPay AID
      expect(payload).toContain("0066812345678"); // Subtag 01 phone
      expect(payload).toContain("5303764"); // Currency THB
      expect(payload).toContain("5406100.00"); // Amount 100.00
      expect(payload).toContain("5802TH"); // Country TH
      expect(payload).toContain("6304"); // CRC tag

      // Checksum is 4 hex chars at the end
      const crcPart = payload.slice(-4);
      expect(crcPart).toMatch(/^[0-9A-F]{4}$/);
    });

    it("generates valid static EMVCo payload without amount", () => {
      const payload = generatePromptPayPayload("0812345678");
      expect(payload).toContain("010211"); // Tag 01 static
      expect(payload).not.toContain("5406"); // No amount tag
      expect(payload.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
    });

    it("generates valid EMVCo payload for National ID", () => {
      const payload = generatePromptPayPayload("1100200345678", 50.5);
      expect(payload).toContain("02131100200345678"); // Subtag 02 national ID
      expect(payload).toContain("540550.50"); // Amount 50.50
      expect(payload.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
    });

    it("throws error for invalid target", () => {
      expect(() => generatePromptPayPayload("invalid")).toThrow();
    });
  });

  describe("generatePromptPayQrDataUrl", () => {
    it("generates base64 PNG data URL", async () => {
      const dataUrl = await generatePromptPayQrDataUrl("0812345678", 100);
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(dataUrl.length).toBeGreaterThan(100);
    });
  });
});
