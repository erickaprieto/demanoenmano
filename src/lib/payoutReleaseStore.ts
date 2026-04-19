import type { Sql } from "postgres";

type PayoutRow = {
  id: string;
  order_id: string;
  seller_user_id: string;
  tracking_number: string;
  status: "pending" | "released";
  created_at: string;
  updated_at: string;
  released_at: string | null;
};

export type PayoutReleaseRow = {
  id: string;
  orderId: string;
  sellerUserId: string;
  trackingNumber: string;
  status: "pending" | "released";
  createdAt: string;
  updatedAt: string;
  releasedAt: string | null;
};

async function getSql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  const g = globalThis as unknown as { __vibePostgresPayoutRelease?: Sql };
  if (!g.__vibePostgresPayoutRelease) {
    const postgres = (await import("postgres")).default;
    g.__vibePostgresPayoutRelease = postgres(url, { max: 1 });
  }
  return g.__vibePostgresPayoutRelease;
}

export async function ensurePayoutReleaseTable(): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS payout_release_queue (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      seller_user_id TEXT NOT NULL,
      tracking_number TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'released')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      released_at TIMESTAMPTZ
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_payout_release_queue_status
    ON payout_release_queue (status, created_at DESC)
  `;
}

export async function enqueuePayoutRelease(input: {
  id: string;
  orderId: string;
  sellerUserId: string;
  trackingNumber: string;
}): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await ensurePayoutReleaseTable();
  await sql`
    INSERT INTO payout_release_queue (
      id, order_id, seller_user_id, tracking_number, status, updated_at
    )
    VALUES (
      ${input.id},
      ${input.orderId},
      ${input.sellerUserId},
      ${input.trackingNumber},
      'pending',
      NOW()
    )
    ON CONFLICT (order_id) DO UPDATE SET
      seller_user_id = EXCLUDED.seller_user_id,
      tracking_number = EXCLUDED.tracking_number,
      status = 'pending',
      updated_at = NOW(),
      released_at = NULL
  `;
}

export async function listPayoutReleaseQueue(): Promise<PayoutReleaseRow[]> {
  const sql = await getSql();
  if (!sql) return [];
  await ensurePayoutReleaseTable();
  const rows = (await sql`
    SELECT
      id, order_id, seller_user_id, tracking_number,
      status, created_at, updated_at, released_at
    FROM payout_release_queue
    ORDER BY
      CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
      created_at DESC
    LIMIT 500
  `) as unknown as PayoutRow[];
  return rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    sellerUserId: r.seller_user_id,
    trackingNumber: r.tracking_number,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    releasedAt: r.released_at,
  }));
}

export async function setPayoutReleaseStatus(input: {
  id: string;
  status: "pending" | "released";
}): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await ensurePayoutReleaseTable();
  await sql`
    UPDATE payout_release_queue
    SET
      status = ${input.status},
      updated_at = NOW(),
      released_at = CASE WHEN ${input.status} = 'released' THEN NOW() ELSE NULL END
    WHERE id = ${input.id}
  `;
}
