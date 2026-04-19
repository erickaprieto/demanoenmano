import { NextResponse } from "next/server";
import type { Sql } from "postgres";
import {
  enforceRateLimit,
  getClientIp,
  requireTrustedOrigin,
  rateLimitExceededResponse,
  requireModerationApiToken,
  sanitizeText,
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

type Body = {
  severity?: string;
  chat_log_url?: string;
  reported_id?: string;
  reporter_id?: string | null;
  reason?: string;
  context_chat_id?: string | null;
  auto_scan_hit_count?: number;
};

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const unauthorized = requireModerationApiToken(req);
  if (unauthorized) return unauthorized;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({
    key: `moderation-admin-alert:${ip}`,
    limit: 40,
    windowMs: 60_000,
  });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const severity = body.severity === "critical" ? "critical" : "standard";
  const chat_log_url = sanitizeText(body.chat_log_url, 500);
  const reported_id = sanitizeText(body.reported_id, 80);
  const reporter_id = sanitizeText(body.reporter_id, 80);
  const reason = sanitizeText(body.reason, 200);
  const context_chat_id =
    body.context_chat_id == null || String(body.context_chat_id).trim() === ""
      ? null
      : String(body.context_chat_id).trim();
  const auto_scan_hit_count =
    typeof body.auto_scan_hit_count === "number" &&
    Number.isFinite(body.auto_scan_hit_count)
      ? Math.max(0, Math.min(10, Math.floor(body.auto_scan_hit_count)))
      : 0;

  if (!chat_log_url || !reported_id || !reporter_id) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }
  if (!/^https?:\/\//i.test(chat_log_url)) {
    return NextResponse.json({ error: "chat_log_url inválido" }, { status: 400 });
  }

  const sql = await getSql();
  if (!sql) {
    return NextResponse.json({ ok: true, persisted: "client" as const });
  }

  try {
    await sql`
      INSERT INTO admin_moderation_alerts (
        severity,
        chat_log_url,
        reported_id,
        reporter_id,
        reason,
        context_chat_id,
        auto_scan_hit_count
      )
      VALUES (
        ${severity},
        ${chat_log_url},
        ${reported_id},
        ${reporter_id},
        ${reason || "unknown"},
        ${context_chat_id},
        ${auto_scan_hit_count}
      )
    `;
    return NextResponse.json({ ok: true, persisted: "database" as const });
  } catch (e) {
    console.error("[moderation/admin-alert]", e);
    return NextResponse.json(
      { error: "No se pudo registrar la alerta" },
      { status: 500 },
    );
  }
}
