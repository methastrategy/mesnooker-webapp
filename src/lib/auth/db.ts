// src/lib/auth/db.ts — auth_users table on the app's Postgres (Neon).
// Same connection string as the journal (DATABASE_URL). Server-side only.
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  passHash: string;
  salt: string;
  createdAt: string;
}

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!pool) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) return null;
    pool = new Pool({ connectionString: url, max: 1 });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export function hasAuthDb(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export async function initAuthDb(): Promise<void> {
  const p = getPool();
  if (!p) return;
  // 1. Create table with username if table does not exist
  await p.query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      pass_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // 2. Safe schema migration for pre-existing tables that were created with email only
  try {
    await p.query(`
      ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS username TEXT;
    `);
    await p.query(`
      UPDATE auth_users SET username = email WHERE username IS NULL;
    `);
    await p.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS auth_users_username_idx ON auth_users (LOWER(username));
    `);
    await p.query(`
      ALTER TABLE auth_users ALTER COLUMN email DROP NOT NULL;
    `);
  } catch {
    // Migration is best-effort and non-blocking
  }
}

export async function findUserByUsername(username: string): Promise<AuthUser | null> {
  const p = getPool();
  if (!p) return null;
  const normalized = username.trim().toLowerCase();
  try {
    const r = await p.query(
      `SELECT id,
              COALESCE(username, email) AS username,
              email,
              pass_hash, salt, created_at
       FROM auth_users
       WHERE LOWER(COALESCE(username, '')) = $1 OR LOWER(COALESCE(email, '')) = $1
       LIMIT 1`,
      [normalized]
    );
    if (r.rows.length === 0) return null;
    const row = r.rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email ?? undefined,
      passHash: row.pass_hash,
      salt: row.salt,
      createdAt: row.created_at,
    };
  } catch (err: unknown) {
    // Fallback if username column does not exist yet in legacy DB
    const msg = String((err as Error)?.message ?? "");
    if (msg.includes('column "username" does not exist')) {
      const r = await p.query(
        "SELECT id, email, pass_hash, salt, created_at FROM auth_users WHERE LOWER(email) = $1 LIMIT 1",
        [normalized]
      );
      if (r.rows.length === 0) return null;
      const row = r.rows[0];
      return {
        id: row.id,
        username: row.email,
        email: row.email,
        passHash: row.pass_hash,
        salt: row.salt,
        createdAt: row.created_at,
      };
    }
    throw err;
  }
}

/** Backward compatible alias for findUserByUsername */
export const findUserByEmail = findUserByUsername;

export async function createUser(username: string, passHash: string, salt: string): Promise<string> {
  const p = getPool();
  if (!p) throw new Error("no database configured");
  const id = randomUUID();
  const normalized = username.trim().toLowerCase();

  try {
    // 1. Primary insert: username populated, email is NULL
    await p.query(
      "INSERT INTO auth_users (id, username, email, pass_hash, salt) VALUES ($1, $2, NULL, $3, $4)",
      [id, normalized, passHash, salt]
    );
  } catch (err: unknown) {
    const msg = String((err as Error)?.message ?? "");
    // If column email does not exist at all in schema
    if (msg.includes('column "email"') && (msg.includes('does not exist') || msg.includes('of relation'))) {
      await p.query(
        "INSERT INTO auth_users (id, username, pass_hash, salt) VALUES ($1, $2, $3, $4)",
        [id, normalized, passHash, salt]
      );
    }
    // If legacy schema enforces NOT NULL on email, fall back to writing normalized username
    else if (msg.includes('violates not-null constraint') || (msg.includes('email') && msg.includes('not-null'))) {
      await p.query(
        "INSERT INTO auth_users (id, username, email, pass_hash, salt) VALUES ($1, $2, $3, $4, $5)",
        [id, normalized, normalized, passHash, salt]
      );
    }
    // If username column does not exist yet (pre-migration legacy table)
    else if (msg.includes('column "username"') && (msg.includes('does not exist') || msg.includes('of relation'))) {
      await p.query(
        "INSERT INTO auth_users (id, email, pass_hash, salt) VALUES ($1, $2, $3, $4)",
        [id, normalized, passHash, salt]
      );
    } else {
      throw err;
    }
  }

  return id;
}

export async function clearAllUsers(): Promise<number> {
  const p = getPool();
  if (!p) throw new Error("no database configured");
  const r = await p.query("DELETE FROM auth_users");
  return r.rowCount ?? 0;
}
