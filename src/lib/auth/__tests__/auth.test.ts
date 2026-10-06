import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  validUsername,
  normalizeUsername,
  validPassword,
} from "../validate";
import { hashPassword, verifyPassword } from "../password";
import { signSession, verifySession } from "../session";
import {
  clientValidUsername,
  clientValidPassword,
  clientValidEmail,
  getSafeRedirectUrl,
} from "../../auth-client";

describe("Auth Validation - Username & Password", () => {
  it("rejects usernames shorter than 2 characters", () => {
    expect(validUsername("")).toBe(false);
    expect(validUsername(" ")).toBe(false);
    expect(validUsername("a")).toBe(false);
    expect(validUsername(" a ")).toBe(false);
    expect(validUsername(null as unknown as string)).toBe(false);
    expect(validUsername(undefined as unknown as string)).toBe(false);
  });

  it("rejects usernames with control characters, newlines, or tabs", () => {
    expect(validUsername("user\nname")).toBe(false);
    expect(validUsername("user\rname")).toBe(false);
    expect(validUsername("user\tname")).toBe(false);
    expect(validUsername("user\x00name")).toBe(false);
    expect(clientValidUsername("user\nname")).toBe(false);
  });

  it("accepts valid usernames >= 2 characters", () => {
    expect(validUsername("ab")).toBe(true);
    expect(validUsername("  ab  ")).toBe(true);
    expect(validUsername("player1")).toBe(true);
    expect(validUsername("เมธา")).toBe(true);
    expect(validUsername("user_99")).toBe(true);
  });

  it("rejects excessively long usernames (> 50 chars)", () => {
    expect(validUsername("a".repeat(51))).toBe(false);
    expect(validUsername("a".repeat(50))).toBe(true);
  });

  it("normalizes username by trimming and lowercasing", () => {
    expect(normalizeUsername("  PlayerOne  ")).toBe("playerone");
    expect(normalizeUsername("TEST")).toBe("test");
  });

  it("validates password length (6–72 chars)", () => {
    expect(validPassword("")).toBe(false);
    expect(validPassword("12345")).toBe(false);
    expect(validPassword("123456")).toBe(true);
    expect(validPassword("securePassword123")).toBe(true);
    expect(validPassword("admin")).toBe(false);
    expect(validPassword("a".repeat(72))).toBe(true);
    expect(validPassword("a".repeat(73))).toBe(false);
  });

  it("checks client validation helpers and legacy email support", () => {
    expect(clientValidUsername("")).toBe(false);
    expect(clientValidUsername("x")).toBe(false);
    expect(clientValidUsername("xy")).toBe(true);
    expect(clientValidUsername("admin")).toBe(true);

    expect(clientValidPassword("admin")).toBe(false);
    expect(clientValidPassword("12345")).toBe(false);
    expect(clientValidPassword("123456")).toBe(true);

    // Legacy emails longer than 50 chars must be accepted for signin
    const longEmail = "someone.with.very.long.email.address@department.university.ac.th";
    expect(longEmail.length).toBeGreaterThan(50);
    expect(clientValidEmail(longEmail)).toBe(true);
  });
});

describe("Password Hashing & Verification", () => {
  it("hashes password and verifies correctly", () => {
    const pass = "secret-pass-123";
    const { hash, salt } = hashPassword(pass);
    expect(hash).toBeDefined();
    expect(salt).toBeDefined();

    expect(verifyPassword(pass, salt, hash)).toBe(true);
    expect(verifyPassword("wrong-pass", salt, hash)).toBe(false);
  });
});

describe("Session JWT Handling", () => {
  const origSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-key-32-bytes-long-12345";
  });

  afterEach(() => {
    process.env.AUTH_SECRET = origSecret;
  });

  it("signs and verifies username session tokens", async () => {
    const token = await signSession({ sub: "u-123", username: "player99" });
    const verified = await verifySession(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe("u-123");
    expect(verified?.username).toBe("player99");
    expect(verified?.email).toBe("player99");
  });

  it("signs and verifies tokens with Thai UTF-8 usernames without crashing", async () => {
    const token = await signSession({ sub: "u-thai", username: "สมชาย เมธา" });
    const verified = await verifySession(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe("u-thai");
    expect(verified?.username).toBe("สมชาย เมธา");
  });

  it("verifies legacy tokens with email and maps to username", async () => {
    // Legacy token payload { sub, email }
    const now = Math.floor(Date.now() / 1000);
    const b64 = (s: string) => Buffer.from(s).toString("base64url");
    const h = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const p = b64(JSON.stringify({ sub: "u-legacy", email: "old@example.com", iat: now, exp: now + 3600 }));
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("test-secret-key-32-bytes-long-12345"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${h}.${p}`)));
    const sigB64 = Buffer.from(sig).toString("base64url");
    const legacyToken = `${h}.${p}.${sigB64}`;

    const verified = await verifySession(legacyToken);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe("u-legacy");
    expect(verified?.username).toBe("old@example.com");
    expect(verified?.email).toBe("old@example.com");
  });

  it("rejects tampered tokens", async () => {
    const token = await signSession({ sub: "u-123", username: "player99" });
    const tampered = token.slice(0, -5) + "aaaaa";
    expect(await verifySession(tampered)).toBeNull();
  });
});

import { POST as signupPost } from "../../../app/api/auth/signup/route";
import { POST as signinPost } from "../../../app/api/auth/signin/route";
import { NextRequest } from "next/server";

describe("API Route Validation - Signup & Signin", () => {
  it("rejects signup when confirmPassword is missing", async () => {
    const req = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username: "newuser", password: "password123" }),
    });
    const res = await signupPost(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Please confirm your password.");
  });

  it("rejects signup when passwords do not match", async () => {
    const req = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        username: "newuser",
        password: "password123",
        confirmPassword: "password456",
      }),
    });
    const res = await signupPost(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Passwords do not match.");
  });

  it("rejects signup when username is shorter than 2 chars", async () => {
    const req = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        username: "a",
        password: "password123",
        confirmPassword: "password123",
      }),
    });
    const res = await signupPost(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Username must be at least 2 characters.");
  });

  it("rejects signup when password is shorter than 6 chars", async () => {
    const req = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        username: "validuser",
        password: "123",
        confirmPassword: "123",
      }),
    });
    const res = await signupPost(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Password must be at least 6 characters");
  });

  it("allows signin with long legacy emails (> 50 chars) without 400 validation error", async () => {
    const longEmail = "someone.with.very.long.email.address@department.university.ac.th";
    const req = new NextRequest("http://localhost/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({
        username: longEmail,
        password: "password123",
      }),
    });
    const res = await signinPost(req);
    // Since DATABASE_URL is not set in test env, it should reach db check (503), NOT 400 validation error
    expect(res.status).not.toBe(400);
    expect(res.status).toBe(503);
  });
});

describe("Safe Redirect URL Validation", () => {
  it("allows safe relative paths with query strings and hashes", () => {
    expect(getSafeRedirectUrl("/match")).toBe("/match");
    expect(getSafeRedirectUrl("/match?frame=2&player=p1")).toBe("/match?frame=2&player=p1");
    expect(getSafeRedirectUrl("/settlement#history")).toBe("/settlement#history");
  });

  it("rejects open redirect attempts to external origins", () => {
    expect(getSafeRedirectUrl("https://evil.com")).toBe("/");
    expect(getSafeRedirectUrl("http://evil.com/phish")).toBe("/");
    expect(getSafeRedirectUrl("//evil.com")).toBe("/");
    expect(getSafeRedirectUrl("//evil.com/path")).toBe("/");
  });

  it("rejects backslash bypasses and protocol-relative tricks", () => {
    expect(getSafeRedirectUrl("/\\evil.com")).toBe("/");
    expect(getSafeRedirectUrl("/\\/evil.com")).toBe("/");
  });

  it("prevents redirect loops back to /login", () => {
    expect(getSafeRedirectUrl("/login")).toBe("/");
  });

  it("falls back to root for null, empty or invalid inputs", () => {
    expect(getSafeRedirectUrl(null)).toBe("/");
    expect(getSafeRedirectUrl("")).toBe("/");
    expect(getSafeRedirectUrl("javascript:alert(1)")).toBe("/");
  });
});

import { checkRateLimit, recordFail, isLocked, clientIp } from "../ratelimit";

describe("Rate Limiting & Admin Credentials", () => {
  it("correctly hashes and verifies initial admin password '123456'", () => {
    const { hash, salt } = hashPassword("123456");
    expect(hash).toBeDefined();
    expect(salt).toBeDefined();
    expect(verifyPassword("123456", salt, hash)).toBe(true);
    expect(verifyPassword("wrongpass", salt, hash)).toBe(false);
  });

  it("extracts client IP from various forward headers", () => {
    const reqFwd = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.195, 10.0.0.1" },
    });
    expect(clientIp(reqFwd)).toBe("203.0.113.195");

    const reqReal = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.42" },
    });
    expect(clientIp(reqReal)).toBe("198.51.100.42");

    const reqCf = new Request("http://localhost", {
      headers: { "cf-connecting-ip": "192.0.2.1" },
    });
    expect(clientIp(reqCf)).toBe("192.0.2.1");
  });

  it("throttles requests with checkRateLimit", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });
    const res1 = checkRateLimit(req, "test_action", 3, 60000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(req, "test_action", 3, 60000);
    expect(res2.allowed).toBe(true);

    const res3 = checkRateLimit(req, "test_action", 3, 60000);
    expect(res3.allowed).toBe(true);

    const res4 = checkRateLimit(req, "test_action", 3, 60000);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
  });

  it("locks out IP after repeated failed attempts", () => {
    const ip = "10.99.88.77";
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": ip },
    });
    expect(isLocked(req)).toBe(false);
    // 5 fails locks out
    recordFail(req);
    recordFail(req);
    recordFail(req);
    recordFail(req);
    const lockedNow = recordFail(req);
    expect(lockedNow).toBe(true);
    expect(isLocked(req)).toBe(true);
  });
});
