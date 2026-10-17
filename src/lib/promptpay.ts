/**
 * PromptPay EMVCo QR Code Generator for Thailand
 * Complies with Bank of Thailand (BOT) & EMVCo QR Code Specification for Payment Systems (Merchant-Presented Mode).
 */
import QRCode from "qrcode";

export type PromptPayTargetType = "mobile" | "nationalId" | "wallet";

export interface PromptPayValidationResult {
  valid: boolean;
  type?: PromptPayTargetType;
  sanitized: string;
  formatted: string;
  error?: string;
}

/** Format Tag-Length-Value according to EMVCo spec */
export function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

/**
 * CRC16-CCITT implementation for EMVCo QR Specification
 * Polynomial: 0x1021, Initial value: 0xFFFF
 */
export function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Validates and normalizes Thai PromptPay identifier (Mobile, National ID, or E-Wallet)
 */
export function validatePromptPayTarget(target: string): PromptPayValidationResult {
  if (!target || typeof target !== "string") {
    return { valid: false, sanitized: "", formatted: "", error: "กรุณาระบุเบอร์โทรศัพท์หรือเลขบัตรประชาชน" };
  }

  const sanitized = target.replace(/[^0-9]/g, "");

  // 1. Mobile Phone Number (Thai standard 10 digits starting with 0, or 9 digits)
  if (sanitized.length === 10 && sanitized.startsWith("0")) {
    const formatted = `${sanitized.slice(0, 3)}-${sanitized.slice(3, 6)}-${sanitized.slice(6)}`;
    return { valid: true, type: "mobile", sanitized, formatted };
  }
  if (sanitized.length === 9 && sanitized.startsWith("0")) {
    const formatted = `${sanitized.slice(0, 2)}-${sanitized.slice(2, 5)}-${sanitized.slice(5)}`;
    return { valid: true, type: "mobile", sanitized, formatted };
  }
  // Mobile with 66 country code (e.g. 66812345678 -> 11 digits)
  if (sanitized.startsWith("66") && sanitized.length === 11) {
    const local = "0" + sanitized.slice(2);
    const formatted = `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
    return { valid: true, type: "mobile", sanitized: local, formatted };
  }

  // 2. National ID / Tax ID (13 digits)
  if (sanitized.length === 13) {
    const formatted = `${sanitized.slice(0, 1)}-${sanitized.slice(1, 5)}-${sanitized.slice(5, 10)}-${sanitized.slice(10, 12)}-${sanitized.slice(12)}`;
    return { valid: true, type: "nationalId", sanitized, formatted };
  }

  // 3. E-Wallet ID (15 digits)
  if (sanitized.length === 15) {
    const formatted = `${sanitized.slice(0, 5)}-${sanitized.slice(5, 10)}-${sanitized.slice(10)}`;
    return { valid: true, type: "wallet", sanitized, formatted };
  }

  return {
    valid: false,
    sanitized,
    formatted: target,
    error: "หมายเลขไม่ถูกต้อง (ต้องเป็นเบอร์มือถือ 10 หลัก หรือเลขบัตร ปชช. 13 หลัก)",
  };
}

/**
 * Format target into EMVCo PromptPay sub-tag payload
 */
export function formatPromptPaySubtag(validation: PromptPayValidationResult): string {
  const { type, sanitized } = validation;

  if (type === "mobile") {
    // International prefix: strip leading 0, prepend 0066 -> 13 chars
    const phoneNoLeadingZero = sanitized.replace(/^0/, "");
    const value = `0066${phoneNoLeadingZero}`.padStart(13, "0");
    return formatTlv("01", value);
  }

  if (type === "nationalId") {
    return formatTlv("02", sanitized);
  }

  if (type === "wallet") {
    return formatTlv("03", sanitized);
  }

  throw new Error(validation.error ?? "Invalid PromptPay target");
}

/**
 * Generates the raw EMVCo payload string for Thai PromptPay
 * @param target Mobile number (08x...), National ID (13 digits), or E-Wallet (15 digits)
 * @param amount Optional transfer amount in Baht (THB)
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  const validation = validatePromptPayTarget(target);
  if (!validation.valid) {
    throw new Error(validation.error ?? "Invalid PromptPay target");
  }

  // Tag 00: Payload Format Indicator (01)
  const tag00 = formatTlv("00", "01");

  // Tag 01: Point of Initiation Method: 12 (Dynamic with amount) or 11 (Static)
  const hasAmount = typeof amount === "number" && !isNaN(amount) && amount > 0;
  const tag01 = formatTlv("01", hasAmount ? "12" : "11");

  // Tag 29: Merchant Account Information - PromptPay
  // Subtag 00: AID for PromptPay Credit Transfer (A000000677010111)
  const aidTlv = formatTlv("00", "A000000677010111");
  const targetTlv = formatPromptPaySubtag(validation);
  const tag29 = formatTlv("29", `${aidTlv}${targetTlv}`);

  // Tag 53: Transaction Currency (764 = THB)
  const tag53 = formatTlv("53", "764");

  // Tag 54: Transaction Amount (formatted to 2 decimal places)
  let tag54 = "";
  if (hasAmount) {
    const formattedAmount = amount.toFixed(2);
    tag54 = formatTlv("54", formattedAmount);
  }

  // Tag 58: Country Code (TH)
  const tag58 = formatTlv("58", "TH");

  // Tag 63: CRC16 checksum
  // Data for CRC starts from Tag 00 up to "6304"
  const rawData = `${tag00}${tag01}${tag29}${tag53}${tag54}${tag58}6304`;
  const checksum = crc16(rawData);

  return `${rawData}${checksum}`;
}

/**
 * Generates a Base64 PNG Data URL representing the PromptPay QR Code
 */
export async function generatePromptPayQrDataUrl(
  target: string,
  amount?: number,
  options?: { width?: number; margin?: number }
): Promise<string> {
  const payload = generatePromptPayPayload(target, amount);
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    width: options?.width ?? 280,
    margin: options?.margin ?? 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
