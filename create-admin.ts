import { hashPassword } from "./src/lib/auth/password";
import { initAuthDb, createUser, findUserByEmail } from "./src/lib/auth/db";

async function run() {
  await initAuthDb();
  
  const existing = await findUserByEmail("admin");
  if (existing) {
    console.log("Admin user already exists");
    process.exit(0);
  }

  const { hash, salt } = hashPassword("admin");
  await createUser("admin", hash, salt);
  console.log("Admin user created successfully");
  process.exit(0);
}

run().catch(console.error);
