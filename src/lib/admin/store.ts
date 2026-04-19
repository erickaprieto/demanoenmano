import type { Sql } from "postgres";
import { SWIPE_PRODUCTS } from "@/data/swipeProducts";

type AuthUserRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  flagged: boolean | null;
  shadow_banned_at: string | null;
  approval_status: "pending" | "approved" | "rejected" | null;
  approval_reason: string | null;
  approval_reviewed_at: string | null;
};

export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  createdAt: string;
  flagged: boolean;
  shadowBannedAt: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
  approvalReason: string | null;
  approvalReviewedAt: string | null;
};

export type AdminListingRow = {
  id: string;
  name: string;
  sellerUserId: string;
  disabled: boolean;
  reason: string | null;
  updatedAt: string | null;
};

export type AdminProductActivityType = "new" | "reported" | "disabled";

export type AdminProductActivityRow = {
  listingId: string;
  listingName: string;
  sellerUserId: string;
  activityType: AdminProductActivityType;
  activityAt: string;
  reason: string | null;
  reportCount: number;
};

export type AdminProductActivityMetrics = {
  newProducts: number;
  reportedProducts: number;
  disabledProducts: number;
};

async function getSql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  const g = globalThis as unknown as { __vibePostgresAdmin?: Sql };
  if (!g.__vibePostgresAdmin) {
    const postgres = (await import("postgres")).default;
    g.__vibePostgresAdmin = postgres(url, { max: 1 });
  }
  return g.__vibePostgresAdmin;
}

export async function ensureAdminTables(): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS user_moderation_state (
      user_id TEXT PRIMARY KEY,
      flagged BOOLEAN NOT NULL DEFAULT false,
      shadow_banned_at TIMESTAMPTZ
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_listing_state (
      listing_id TEXT PRIMARY KEY,
      disabled BOOLEAN NOT NULL DEFAULT false,
      reason TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_listing_created_state (
      listing_id TEXT PRIMARY KEY,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const sql = await getSql();
  if (!sql) return [];
  await ensureAdminTables();
  const rows = (await sql`
    SELECT
      a.id, a.email, a.full_name, a.phone, a.created_at,
      m.flagged, m.shadow_banned_at,
      ap.status AS approval_status,
      ap.reason AS approval_reason,
      ap.reviewed_at AS approval_reviewed_at
    FROM auth_users a
    LEFT JOIN user_moderation_state m ON m.user_id = a.id
    LEFT JOIN auth_user_approval ap ON ap.user_id = a.id
    ORDER BY a.created_at DESC
    LIMIT 500
  `) as unknown as AuthUserRow[];
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    phone: r.phone,
    createdAt: r.created_at,
    flagged: Boolean(r.flagged),
    shadowBannedAt: r.shadow_banned_at,
    approvalStatus: r.approval_status ?? "approved",
    approvalReason: r.approval_reason,
    approvalReviewedAt: r.approval_reviewed_at,
  }));
}

export async function setUserBanned(userId: string, banned: boolean): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  if (banned) {
    await sql`
      INSERT INTO user_moderation_state (user_id, flagged, shadow_banned_at)
      VALUES (${userId}, true, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        flagged = true,
        shadow_banned_at = NOW()
    `;
  } else {
    await sql`
      INSERT INTO user_moderation_state (user_id, flagged, shadow_banned_at)
      VALUES (${userId}, false, NULL)
      ON CONFLICT (user_id) DO UPDATE SET
        flagged = false,
        shadow_banned_at = NULL
    `;
  }
}

export async function listAdminListings(): Promise<AdminListingRow[]> {
  const sql = await getSql();
  if (!sql) {
    return SWIPE_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      sellerUserId: p.sellerUserId ?? `seller_${p.id}`,
      disabled: false,
      reason: null,
      updatedAt: null,
    }));
  }
  await ensureAdminTables();
  const flags = (await sql`
    SELECT listing_id, disabled, reason, updated_at
    FROM admin_listing_state
  `) as unknown as Array<{
    listing_id: string;
    disabled: boolean;
    reason: string | null;
    updated_at: string;
  }>;
  const byId = new Map(flags.map((f) => [f.listing_id, f]));
  return SWIPE_PRODUCTS.map((p) => {
    const f = byId.get(p.id);
    return {
      id: p.id,
      name: p.name,
      sellerUserId: p.sellerUserId ?? `seller_${p.id}`,
      disabled: Boolean(f?.disabled),
      reason: f?.reason ?? null,
      updatedAt: f?.updated_at ?? null,
    };
  });
}

export async function setListingDisabled(input: {
  listingId: string;
  disabled: boolean;
  reason: string | null;
}): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await ensureAdminTables();
  await sql`
    INSERT INTO admin_listing_state (listing_id, disabled, reason, updated_at)
    VALUES (${input.listingId}, ${input.disabled}, ${input.reason}, NOW())
    ON CONFLICT (listing_id) DO UPDATE SET
      disabled = ${input.disabled},
      reason = ${input.reason},
      updated_at = NOW()
  `;
}

export async function listDisabledListingIds(): Promise<string[]> {
  const sql = await getSql();
  if (!sql) return [];
  await ensureAdminTables();
  const rows = (await sql`
    SELECT listing_id
    FROM admin_listing_state
    WHERE disabled = true
  `) as unknown as Array<{ listing_id: string }>;
  return rows.map((r) => r.listing_id);
}

type UserReportAggRow = {
  reported_id: string;
  report_count: string | number;
  last_reported_at: string;
};

export async function listAdminProductActivity(input?: {
  windowHours?: number;
  activityType?: "all" | AdminProductActivityType;
}): Promise<{
  rows: AdminProductActivityRow[];
  metrics: AdminProductActivityMetrics;
}> {
  const windowHoursRaw = input?.windowHours ?? 24;
  const windowHours = Number.isFinite(windowHoursRaw)
    ? Math.max(1, Math.min(24 * 30, Math.floor(windowHoursRaw)))
    : 24;
  const activityType = input?.activityType ?? "all";

  const sql = await getSql();
  if (!sql) {
    return {
      rows: [],
      metrics: { newProducts: 0, reportedProducts: 0, disabledProducts: 0 },
    };
  }

  await ensureAdminTables();
  for (const product of SWIPE_PRODUCTS) {
    await sql`
      INSERT INTO admin_listing_created_state (listing_id)
      VALUES (${product.id})
      ON CONFLICT (listing_id) DO NOTHING
    `;
  }

  const rows: AdminProductActivityRow[] = [];
  const byId = new Map(
    SWIPE_PRODUCTS.map((p) => [
      p.id,
      {
        name: p.name,
        sellerUserId: p.sellerUserId ?? `seller_${p.id}`,
      },
    ]),
  );
  const bySellerId = new Map(
    SWIPE_PRODUCTS.map((p) => [
      p.sellerUserId ?? `seller_${p.id}`,
      { id: p.id, name: p.name },
    ]),
  );

  const newRows = (await sql`
    SELECT c.listing_id, c.first_seen_at::text AS activity_at
    FROM admin_listing_created_state c
    WHERE c.first_seen_at >= NOW() - (${windowHours} * INTERVAL '1 hour')
    ORDER BY c.first_seen_at DESC
  `) as unknown as Array<{ listing_id: string; activity_at: string }>;
  for (const row of newRows) {
    const listing = byId.get(row.listing_id);
    if (!listing) continue;
    rows.push({
      listingId: row.listing_id,
      listingName: listing.name,
      sellerUserId: listing.sellerUserId,
      activityType: "new",
      activityAt: row.activity_at,
      reason: null,
      reportCount: 0,
    });
  }

  const disabledRows = (await sql`
    SELECT s.listing_id, s.updated_at::text AS activity_at, s.reason
    FROM admin_listing_state s
    WHERE s.disabled = true
      AND s.updated_at >= NOW() - (${windowHours} * INTERVAL '1 hour')
    ORDER BY s.updated_at DESC
  `) as unknown as Array<{
    listing_id: string;
    activity_at: string;
    reason: string | null;
  }>;
  for (const row of disabledRows) {
    const listing = byId.get(row.listing_id);
    if (!listing) continue;
    rows.push({
      listingId: row.listing_id,
      listingName: listing.name,
      sellerUserId: listing.sellerUserId,
      activityType: "disabled",
      activityAt: row.activity_at,
      reason: row.reason,
      reportCount: 0,
    });
  }

  try {
    const reportRows = (await sql`
      SELECT
        r.reported_id,
        COUNT(*)::int AS report_count,
        MAX(r.created_at)::text AS last_reported_at
      FROM user_reports r
      WHERE r.created_at >= NOW() - (${windowHours} * INTERVAL '1 hour')
      GROUP BY r.reported_id
      ORDER BY MAX(r.created_at) DESC
    `) as unknown as UserReportAggRow[];
    for (const row of reportRows) {
      const listing = bySellerId.get(row.reported_id);
      if (!listing) continue;
      rows.push({
        listingId: listing.id,
        listingName: listing.name,
        sellerUserId: row.reported_id,
        activityType: "reported",
        activityAt: row.last_reported_at,
        reason: null,
        reportCount:
          typeof row.report_count === "number"
            ? row.report_count
            : Number.parseInt(row.report_count, 10) || 0,
      });
    }
  } catch {
    // user_reports puede no existir en ambientes nuevos.
  }

  const metrics: AdminProductActivityMetrics = {
    newProducts: rows.filter((r) => r.activityType === "new").length,
    reportedProducts: rows.filter((r) => r.activityType === "reported").length,
    disabledProducts: rows.filter((r) => r.activityType === "disabled").length,
  };

  const filtered =
    activityType === "all"
      ? rows
      : rows.filter((row) => row.activityType === activityType);
  filtered.sort(
    (a, b) =>
      new Date(b.activityAt).getTime() - new Date(a.activityAt).getTime(),
  );

  return { rows: filtered, metrics };
}
