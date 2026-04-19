import type { Sql } from "postgres";

export type SellerVerificationStatus =
  | "not_submitted"
  | "pending"
  | "approved"
  | "rejected";

export type SellerVerificationRecord = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  cedula: string;
  iban: string;
  selfieImageDataUrl: string;
  selfieMimeType: string;
  selfieSizeBytes: number;
  selfieWidth: number;
  selfieHeight: number;
  status: Exclude<SellerVerificationStatus, "not_submitted">;
  autoChecks: string[];
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

async function getSql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  const g = globalThis as unknown as { __vibePostgresSellerKyc?: Sql };
  if (!g.__vibePostgresSellerKyc) {
    const postgres = (await import("postgres")).default;
    g.__vibePostgresSellerKyc = postgres(url, { max: 1 });
  }
  return g.__vibePostgresSellerKyc;
}

export async function ensureSellerVerificationTable(): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS seller_verification_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      cedula TEXT NOT NULL,
      iban TEXT NOT NULL,
      selfie_image_data_url TEXT NOT NULL,
      selfie_mime_type TEXT NOT NULL,
      selfie_size_bytes INTEGER NOT NULL,
      selfie_width INTEGER NOT NULL,
      selfie_height INTEGER NOT NULL,
      status TEXT NOT NULL,
      auto_checks_json TEXT NOT NULL,
      reject_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ
    )
  `;
}

export async function upsertSellerVerification(input: Omit<SellerVerificationRecord, "createdAt" | "reviewedAt">): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await ensureSellerVerificationTable();
  await sql`
    INSERT INTO seller_verification_requests (
      id, user_id, full_name, email, cedula, iban,
      selfie_image_data_url, selfie_mime_type, selfie_size_bytes, selfie_width, selfie_height,
      status, auto_checks_json, reject_reason, created_at, reviewed_at
    )
    VALUES (
      ${input.id}, ${input.userId}, ${input.fullName}, ${input.email}, ${input.cedula}, ${input.iban},
      ${input.selfieImageDataUrl}, ${input.selfieMimeType}, ${input.selfieSizeBytes}, ${input.selfieWidth}, ${input.selfieHeight},
      ${input.status}, ${JSON.stringify(input.autoChecks)}, ${input.rejectReason}, NOW(), NULL
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      cedula = EXCLUDED.cedula,
      iban = EXCLUDED.iban,
      selfie_image_data_url = EXCLUDED.selfie_image_data_url,
      selfie_mime_type = EXCLUDED.selfie_mime_type,
      selfie_size_bytes = EXCLUDED.selfie_size_bytes,
      selfie_width = EXCLUDED.selfie_width,
      selfie_height = EXCLUDED.selfie_height,
      status = EXCLUDED.status,
      auto_checks_json = EXCLUDED.auto_checks_json,
      reject_reason = EXCLUDED.reject_reason,
      created_at = NOW(),
      reviewed_at = NULL
  `;
}

export async function getSellerVerificationByUser(userId: string): Promise<SellerVerificationRecord | null> {
  const sql = await getSql();
  if (!sql) return null;
  await ensureSellerVerificationTable();
  const rows = (await sql`
    SELECT * FROM seller_verification_requests
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `) as unknown as Array<Record<string, unknown>>;
  const row = rows[0];
  if (!row) return null;
  return mapRow(row);
}

export async function listSellerVerificationRequests(): Promise<SellerVerificationRecord[]> {
  const sql = await getSql();
  if (!sql) return [];
  await ensureSellerVerificationTable();
  const rows = (await sql`
    SELECT * FROM seller_verification_requests
    ORDER BY created_at DESC
    LIMIT 500
  `) as unknown as Array<Record<string, unknown>>;
  return rows.map(mapRow);
}

export async function reviewSellerVerification(input: {
  id: string;
  status: "approved" | "rejected";
  rejectReason: string | null;
}): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await ensureSellerVerificationTable();
  await sql`
    UPDATE seller_verification_requests
    SET status = ${input.status},
        reject_reason = ${input.rejectReason},
        reviewed_at = NOW()
    WHERE id = ${input.id}
  `;
}

function mapRow(row: Record<string, unknown>): SellerVerificationRecord {
  const checksRaw = String(row.auto_checks_json ?? "[]");
  let checks: string[] = [];
  try {
    const parsed = JSON.parse(checksRaw);
    checks = Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    checks = [];
  }
  return {
    id: String(row.id),
    userId: String(row.user_id),
    fullName: String(row.full_name),
    email: String(row.email),
    cedula: String(row.cedula),
    iban: String(row.iban),
    selfieImageDataUrl: String(row.selfie_image_data_url),
    selfieMimeType: String(row.selfie_mime_type),
    selfieSizeBytes: Number(row.selfie_size_bytes ?? 0),
    selfieWidth: Number(row.selfie_width ?? 0),
    selfieHeight: Number(row.selfie_height ?? 0),
    status: String(row.status) as Exclude<SellerVerificationStatus, "not_submitted">,
    autoChecks: checks,
    rejectReason: row.reject_reason == null ? null : String(row.reject_reason),
    createdAt: String(row.created_at),
    reviewedAt: row.reviewed_at == null ? null : String(row.reviewed_at),
  };
}
