import type { Sql } from "postgres";

type ShippingRow = {
  id: string;
  order_id: string;
  seller_user_id: string;
  tracking_number: string;
  carrier: string;
  created_at: string;
  updated_at: string;
};

export type ShippingRecord = {
  id: string;
  orderId: string;
  sellerUserId: string;
  trackingNumber: string;
  carrier: string;
  createdAt: string;
  updatedAt: string;
};

async function getSql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  const g = globalThis as unknown as { __vibePostgresShippings?: Sql };
  if (!g.__vibePostgresShippings) {
    const postgres = (await import("postgres")).default;
    g.__vibePostgresShippings = postgres(url, { max: 1 });
  }
  return g.__vibePostgresShippings;
}

export async function ensureShippingsTable(): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS shippings (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      seller_user_id TEXT NOT NULL,
      tracking_number TEXT NOT NULL,
      carrier TEXT NOT NULL DEFAULT 'Correos de Costa Rica',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_shippings_seller_user_id
    ON shippings (seller_user_id)
  `;
}

export async function upsertShippingForOrder(input: {
  id: string;
  orderId: string;
  sellerUserId: string;
  trackingNumber: string;
  carrier?: string;
}): Promise<ShippingRecord | null> {
  const sql = await getSql();
  if (!sql) return null;
  await ensureShippingsTable();
  const rows = (await sql`
    INSERT INTO shippings (
      id, order_id, seller_user_id, tracking_number, carrier, updated_at
    )
    VALUES (
      ${input.id},
      ${input.orderId},
      ${input.sellerUserId},
      ${input.trackingNumber},
      ${input.carrier ?? "Correos de Costa Rica"},
      NOW()
    )
    ON CONFLICT (order_id) DO UPDATE SET
      tracking_number = EXCLUDED.tracking_number,
      carrier = EXCLUDED.carrier,
      seller_user_id = EXCLUDED.seller_user_id,
      updated_at = NOW()
    RETURNING id, order_id, seller_user_id, tracking_number, carrier, created_at, updated_at
  `) as unknown as ShippingRow[];
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    sellerUserId: row.seller_user_id,
    trackingNumber: row.tracking_number,
    carrier: row.carrier,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
