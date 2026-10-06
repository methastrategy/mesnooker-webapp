import * as fs from "node:fs";
import * as path from "node:path";
import { hashPassword } from "./src/lib/auth/password";
import { initAuthDb, createUser, clearAllUsers, closePool } from "./src/lib/auth/db";

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

async function run() {
  loadEnvLocal();
  await initAuthDb();
  
  // Clear any existing accounts and recreate admin: 123456
  await clearAllUsers();
  const { hash, salt } = hashPassword("123456");
  const id = await createUser("admin", hash, salt);
  console.log(`Admin user created/reset successfully (id: ${id}, username: admin, password: 123456)`);
  await closePool();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
