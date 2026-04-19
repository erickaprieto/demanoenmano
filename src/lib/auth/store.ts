import type { Sql } from "postgres";
import { createHash } from "node:crypto";

type AuthUserRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  password_hash: string;
  created_at: string;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  passwordHash: string;
};

export type UserApprovalStatus = "pending" | "approved" | "rejected";

type UserApprovalRow = {
  user_id: string;
  status: UserApprovalStatus;
  reason: string | null;
  reviewed_at: string | null;
};

export type ResetTokenRecord = {
  userId: string;
  tokenHash: string;
  expiresAt: string;
};

async function getSql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  const g = globalThis as unknown as { __vibePostgresAuth?: Sql };
  if (!g.__vibePostgresAuth) {
    const postgres = (await import("postgres")).default;
    g.__vibePostgresAuth = postgres(url, { max: 1 });
  }
  return g.__vibePostgresAuth;
}

export async function ensureAuthTables(): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_password_resets (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      consumed_at TIMESTAMPTZ
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_user_approval (
      user_id TEXT PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
      reason TEXT,
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const sql = await getSql();
  if (!sql) return null;
  await ensureAuthTables();
  const rows = (await sql`
    SELECT id, email, full_name, phone, password_hash, created_at
    FROM auth_users
    WHERE email = ${email.toLowerCase()}
    LIMIT 1
  `) as unknown as AuthUserRow[];
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    passwordHash: row.password_hash,
  };
}

export async function createUser(input: {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  passwordHash: string;
}): Promise<AuthUser> {
  const sql = await getSql();
  if (!sql) {
    throw new Error("DATABASE_URL no configurada");
  }
  await ensureAuthTables();
  const rows = (await sql`
    INSERT INTO auth_users (id, email, full_name, phone, password_hash)
    VALUES (${input.id}, ${input.email.toLowerCase()}, ${input.fullName}, ${input.phone}, ${input.passwordHash})
    RETURNING id, email, full_name, phone, password_hash, created_at
  `) as unknown as AuthUserRow[];
  const row = rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    passwordHash: row.password_hash,
  };
}

export async function createPendingUserApproval(userId: string): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await ensureAuthTables();
  await sql`
    INSERT INTO auth_user_approval (user_id, status, reason, reviewed_at, updated_at)
    VALUES (${userId}, 'pending', NULL, NULL, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'pending',
      reason = NULL,
      reviewed_at = NULL,
      updated_at = NOW()
  `;
}

export async function getUserApprovalStatus(userId: string): Promise<{
  status: UserApprovalStatus;
  reason: string | null;
} | null> {
  const sql = await getSql();
  if (!sql) return null;
  await ensureAuthTables();
  const rows = (await sql`
    SELECT user_id, status, reason, reviewed_at
    FROM auth_user_approval
    WHERE user_id = ${userId}
    LIMIT 1
  `) as unknown as UserApprovalRow[];
  const row = rows[0];
  if (!row) return null;
  return { status: row.status, reason: row.reason };
}

export async function setUserApprovalStatus(input: {
  userId: string;
  status: UserApprovalStatus;
  reason: string | null;
}): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await ensureAuthTables();
  await sql`
    INSERT INTO auth_user_approval (user_id, status, reason, reviewed_at, updated_at)
    VALUES (
      ${input.userId},
      ${input.status},
      ${input.reason},
      CASE WHEN ${input.status} = 'pending' THEN NULL ELSE NOW() END,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      status = ${input.status},
      reason = ${input.reason},
      reviewed_at = CASE WHEN ${input.status} = 'pending' THEN NULL ELSE NOW() END,
      updated_at = NOW()
  `;
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(input: {
  userId: string;
  tokenHash: string;
  expiresAtIso: string;
}): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await ensureAuthTables();
  await sql`
    INSERT INTO auth_password_resets (token_hash, user_id, expires_at)
    VALUES (${input.tokenHash}, ${input.userId}, ${input.expiresAtIso}::timestamptz)
  `;
}

export async function consumePasswordResetToken(
  tokenHash: string,
): Promise<ResetTokenRecord | null> {
  const sql = await getSql();
  if (!sql) return null;
  await ensureAuthTables();
  const rows = (await sql`
    UPDATE auth_password_resets
    SET consumed_at = NOW()
    WHERE token_hash = ${tokenHash}
      AND consumed_at IS NULL
      AND expires_at > NOW()
    RETURNING user_id, token_hash, expires_at
  `) as unknown as Array<{ user_id: string; token_hash: string; expires_at: string }>;
  const row = rows[0];
  if (!row) return null;
  return {
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
  };
}

export async function updateUserPassword(input: {
  userId: string;
  passwordHash: string;
}): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await ensureAuthTables();
  await sql`
    UPDATE auth_users
    SET password_hash = ${input.passwordHash}
    WHERE id = ${input.userId}
  `;
}
