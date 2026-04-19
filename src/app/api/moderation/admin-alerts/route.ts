import { NextResponse } from "next/server";
import type { Sql } from "postgres";
import {
  enforceRateLimit,
  getClientIp,
  requireTrustedOrigin,
  rateLimitExceededResponse,
  requireModerationApiToken,
} from "@/lib/apiSecurity";

export const runtime = "nodejs";

async function getSql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const g = globalThis as unknown as { __vibePostgresModeration?: Sql };
  if (!g.__vibePostgresModeration) {
    const postgres = (await import("postgres")).default;
    g.__vibePostgresModeration = postgres(url, { max: 1 });
  }
  return g.__vibePostgresModeration;
}

export async function GET(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const unauthorized = requireModerationApiToken(req);
  if (unauthorized) return unauthorized;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({
    key: `moderation-admin-alerts:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  const sql = await getSql();
  if (!sql) {
    return NextResponse.json({ rows: [], source: "none" as const });
  }
  try {
    const rows = await sql`
      SELECT id, created_at, severity, chat_log_url, reported_id, reporter_id,
             reason, context_chat_id, auto_scan_hit_count
      FROM admin_moderation_alerts
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({
      rows: rows as unknown as Record<string, unknown>[],
      source: "database" as const,
    });
  } catch (e) {
    console.error("[moderation/admin-alerts]", e);
    return NextResponse.json(
      { rows: [], source: "error" as const, error: "query_failed" },
      { status: 500 },
    );
  }
}
