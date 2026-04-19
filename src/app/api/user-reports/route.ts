import { NextResponse } from "next/server";
import type { Sql } from "postgres";
import type {
  UserReportPayload,
  UserReportReason,
  UserReportSeverity,
} from "@/lib/userReports";
import {
  enforceRateLimit,
  getClientIp,
  isSafeId,
  requireTrustedOrigin,
  rateLimitExceededResponse,
  sanitizeText,
} from "@/lib/apiSecurity";

export const runtime = "nodejs";

const REASONS: UserReportReason[] = [
  "negotiate_outside",
  "contact_leak",
  "wrong_category",
  "abuse_scam",
];

async function getSql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const g = globalThis as unknown as { __vibePostgresReports?: Sql };
  if (!g.__vibePostgresReports) {
    const postgres = (await import("postgres")).default;
    g.__vibePostgresReports = postgres(url, { max: 1 });
  }
  return g.__vibePostgresReports;
}

async function ensureUserReportsChatColumns(sql: Sql): Promise<void> {
  await sql`ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS chat_snippet TEXT`;
  await sql`ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS chat_snapshot_json TEXT`;
}

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({
    key: `user-reports:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  const body = (await req.json()) as Partial<UserReportPayload>;
  const reporter_id = sanitizeText(body.reporter_id, 80);
  const reported_id = sanitizeText(body.reported_id, 80);
  const reason = body.reason as UserReportReason;
  const comments = sanitizeText(body.comments, 500);
  const context_chat_id =
    body.context_chat_id == null || sanitizeText(body.context_chat_id, 120) === ""
      ? null
      : sanitizeText(body.context_chat_id, 120);

  const severity: UserReportSeverity =
    body.severity === "critical" ? "critical" : "standard";
  const auto_scan_hit_count =
    typeof body.auto_scan_hit_count === "number" &&
    Number.isFinite(body.auto_scan_hit_count)
      ? Math.max(0, Math.min(10, Math.floor(body.auto_scan_hit_count)))
      : 0;

  const chat_snippet =
    body.chat_snippet == null || String(body.chat_snippet).trim() === ""
      ? null
      : sanitizeText(body.chat_snippet, 2_000);

  let chat_snapshot_json: string | null = null;
  if (typeof body.chat_snapshot_json === "string") {
    const raw = body.chat_snapshot_json.trim();
    if (raw.length > 0) {
      if (raw.length > 52_000) {
        return NextResponse.json(
          { error: "Fragmento de chat demasiado largo." },
          { status: 400 },
        );
      }
      try {
        JSON.parse(raw);
        chat_snapshot_json = raw;
      } catch {
        return NextResponse.json(
          { error: "chat_snapshot_json inválido." },
          { status: 400 },
        );
      }
    }
  }

  if (!reporter_id || !reported_id || !isSafeId(reporter_id) || !isSafeId(reported_id)) {
    return NextResponse.json({ error: "Faltan identificadores" }, { status: 400 });
  }
  if (reporter_id === reported_id) {
    return NextResponse.json(
      { error: "No podés reportarte a vos mismo." },
      { status: 400 },
    );
  }
  if (!REASONS.includes(reason)) {
    return NextResponse.json({ error: "Motivo inválido" }, { status: 400 });
  }

  const sql = await getSql();
  if (!sql) {
    return NextResponse.json({ ok: true, persisted: "client" as const });
  }

  try {
    await ensureUserReportsChatColumns(sql);
    await sql`
      INSERT INTO user_reports (
        reporter_id,
        reported_id,
        reason,
        comments,
        context_chat_id,
        severity,
        auto_scan_hit_count,
        chat_snippet,
        chat_snapshot_json
      )
      VALUES (
        ${reporter_id},
        ${reported_id},
        ${reason},
        ${comments || null},
        ${context_chat_id},
        ${severity},
        ${auto_scan_hit_count},
        ${chat_snippet},
        ${chat_snapshot_json}
      )
    `;
    return NextResponse.json({ ok: true, persisted: "database" as const });
  } catch (e) {
    console.error("[user-reports] POST", e);
    return NextResponse.json(
      { error: "No se pudo guardar el reporte" },
      { status: 500 },
    );
  }
}
