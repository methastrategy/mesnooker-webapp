// src/lib/auth/db.ts — auth_users table on the app's Postgres (Neon).
// Same connection string as the journal (DATABASE_URL). Server-side only.
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

export interface AuthUser {
  id: string;
  email: string;
  passHash: string;
  salt: string;
  createdAt: string;
}

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!pool) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) return null;
    pool = new Pool({ connectionString: url, max: 1 });
  }
  return pool;
}

export function hasAuthDb(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export async function initAuthDb(): Promise<void> {
  const p = getPool();
  if (!p) return;
  await p.query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      pass_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const p = getPool();
  if (!p) return null;
  const r = await p.query(
    "SELECT id, email, pass_hash, salt, created_at FROM auth_users WHERE email = $1",
    [email.toLowerCase()]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    id: row.id,
    email: row.email,
    passHash: row.pass_hash,
    salt: row.salt,
    createdAt: row.created_at,
  };
}

export async function createUser(email: string, passHash: string, salt: string): Promise<string> {
  const p = getPool();
  if (!p) throw new Error("no database configured");
  const id = randomUUID();
  await p.query(
    "INSERT INTO auth_users (id, email, pass_hash, salt) VALUES ($1, $2, $3, $4)",
    [id, email.toLowerCase(), passHash, salt]
  );
  return id;
}
