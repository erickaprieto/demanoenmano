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

/**
 * Equivale a invocar la RPC `shadow_ban_user` en Supabase cuando exista.
 * Marca `user_moderation_state.flagged`; ocultar productos en tu modelo de datos.
 */
export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const unauthorized = requireModerationApiToken(req);
  if (unauthorized) return unauthorized;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({
    key: `moderation-shadow-ban:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: { reported_user_id?: string };
  try {
    body = (await req.json()) as { reported_user_id?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const reported_user_id = sanitizeText(body.reported_user_id, 80);
  if (!reported_user_id) {
    return NextResponse.json(
      { error: "Falta reported_user_id" },
      { status: 400 },
    );
  }

  const sql = await getSql();
  if (!sql) {
    return NextResponse.json({ ok: true, persisted: "client" as const });
  }

  try {
    await sql`
      INSERT INTO user_moderation_state (user_id, flagged)
      VALUES (${reported_user_id}, true)
      ON CONFLICT (user_id) DO UPDATE SET
        flagged = true,
        shadow_banned_at = NOW()
    `;
    return NextResponse.json({ ok: true, persisted: "database" as const });
  } catch (e) {
    console.error("[moderation/shadow-ban]", e);
    return NextResponse.json(
      { error: "No se pudo aplicar shadow ban (¿migración moderation_automation.sql?)" },
      { status: 500 },
    );
  }
}
