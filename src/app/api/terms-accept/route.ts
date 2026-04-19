import { NextResponse } from "next/server";
import type { Sql } from "postgres";
import {
  enforceRateLimit,
  getClientIp,
  isSafeId,
  requireTrustedOrigin,
  rateLimitExceededResponse,
  sanitizeText,
} from "@/lib/apiSecurity";

export const runtime = "nodejs";

async function getSql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const g = globalThis as unknown as { __vibePostgresProfiles?: Sql };
  if (!g.__vibePostgresProfiles) {
    const postgres = (await import("postgres")).default;
    g.__vibePostgresProfiles = postgres(url, { max: 1 });
  }
  return g.__vibePostgresProfiles;
}

type Body = {
  userId?: string;
  checks?: {
    custody?: boolean;
    shipping?: boolean;
    contact?: boolean;
  };
};

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({
    key: `terms-accept:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const c = body.checks;
  if (!c?.custody || !c?.shipping || !c?.contact) {
    return NextResponse.json(
      { error: "Debés aceptar los tres ítems obligatorios." },
      { status: 400 },
    );
  }

  const userId = sanitizeText(body.userId, 80);
  if (!userId || !isSafeId(userId)) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  const sql = await getSql();
  if (sql) {
    try {
      await sql`
        INSERT INTO profiles (id, accepted_terms)
        VALUES (${userId}, true)
        ON CONFLICT (id) DO UPDATE SET accepted_terms = true
      `;
    } catch (e) {
      console.error("[terms-accept] db", e);
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("vibe_accepted_terms", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
    httpOnly: true,
    secure: true,
  });
  return res;
}
