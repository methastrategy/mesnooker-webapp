import { BrowserContext } from "@playwright/test";
import { signSession, SESSION_COOKIE } from "@/lib/auth/session";


export async function loginAsTestUser(
  context: BrowserContext,
  user: { sub?: string; username?: string; email?: string } = {},
  baseUrl?: string
) {
  const currentPort = process.env.PORT || "3005";
  const currentBaseUrl = process.env.BASE_URL || `http://127.0.0.1:${currentPort}`;

  if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = "68f7854474e1b40796d17d84d6ae231a8c6319d30aaf144e0b2ecd6e92966afe";
  }

  const token = await signSession({
    sub: user.sub || "usr_e2e_test_999",
    username: user.username || "metha_e2e",
    email: user.email || "metha@e2e.test",
  });

  const targetUrls = new Set<string>([
    currentBaseUrl,
    `http://127.0.0.1:${currentPort}`,
    `http://localhost:${currentPort}`,
    `http://[::1]:${currentPort}`,
  ]);

  if (baseUrl) {
    targetUrls.add(baseUrl);
  }
  if (process.env.BASE_URL) {
    targetUrls.add(process.env.BASE_URL);
  }

  type Cookie = Parameters<BrowserContext["addCookies"]>[0][number];
  const cookies: Cookie[] = [];

  for (const url of targetUrls) {
    cookies.push({
      name: SESSION_COOKIE,
      value: token,
      url,
      httpOnly: true,
      sameSite: "Lax",
    });
  }

  // Explicit domain cookies for 127.0.0.1, localhost, and [::1]
  const targetDomains = new Set<string>(["127.0.0.1", "localhost", "[::1]"]);
  for (const urlStr of targetUrls) {
    try {
      const parsed = new URL(urlStr);
      if (parsed.hostname) {
        targetDomains.add(parsed.hostname);
      }
    } catch {}
  }

  for (const domain of targetDomains) {
    cookies.push({
      name: SESSION_COOKIE,
      value: token,
      domain,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });
  }

  await context.addCookies(cookies);
}
