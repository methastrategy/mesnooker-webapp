import { BrowserContext } from "@playwright/test";
import { signSession, SESSION_COOKIE } from "@/lib/auth/session";

export async function loginAsTestUser(
  context: BrowserContext,
  user: { sub?: string; username?: string; email?: string } = {},
  baseUrl: string = "http://localhost:3005"
) {
  if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = "68f7854474e1b40796d17d84d6ae231a8c6319d30aaf144e0b2ecd6e92966afe";
  }

  const token = await signSession({
    sub: user.sub || "usr_e2e_test_999",
    username: user.username || "metha_e2e",
    email: user.email || "metha@e2e.test",
  });

  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: token,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
