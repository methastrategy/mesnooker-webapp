import * as fs from "node:fs";
import * as path from "node:path";
import { initAuthDb, createUser, clearAllUsers, findUserByUsername, closePool } from "../src/lib/auth/db";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";

function loadEnvLocal() {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return;

  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

async function main() {
  loadEnvLocal();

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.error("❌ Error: DATABASE_URL is not set in environment or .env.local");
    process.exit(1);
  }

  console.log("🎱 Starting Mesnooker Auth Database Reset...");

  // 1. Ensure table schema is up to date
  await initAuthDb();
  console.log("✓ auth_users table verified / initialized");

  // 2. Clear all existing users
  const deletedCount = await clearAllUsers();
  console.log(`✓ Cleared ${deletedCount} existing user account(s) from auth_users`);

  // 3. Create single initial admin account
  const adminUsername = "admin";
  const adminPassword = "123456";

  const { hash, salt } = hashPassword(adminPassword);
  const adminId = await createUser(adminUsername, hash, salt);
  console.log(`✓ Created initial admin account (ID: ${adminId}, username: "${adminUsername}")`);

  // 4. Verify account and password
  const user = await findUserByUsername(adminUsername);
  if (!user) {
    throw new Error("Verification failed: newly created admin user could not be retrieved");
  }

  const isVerified = verifyPassword(adminPassword, user.salt, user.passHash);
  if (!isVerified) {
    throw new Error("Verification failed: password hash verification returned false");
  }

  console.log("✓ Verified credentials: username: admin ; password: 123456 (scrypt hash matched)");
  console.log("✨ Reset complete! Only admin is active. New users can sign up normally.");

  await closePool();
}

main().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
