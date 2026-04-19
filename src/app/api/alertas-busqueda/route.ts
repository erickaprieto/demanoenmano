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

type Body = {
  usuario_id?: string;
  termino_busqueda?: string;
  categoria_id?: string | null;
};

async function getSql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const g = globalThis as unknown as { __vibePostgres?: Sql };
  if (!g.__vibePostgres) {
    const postgres = (await import("postgres")).default;
    g.__vibePostgres = postgres(url, { max: 1 });
  }
  return g.__vibePostgres;
}

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({
    key: `alertas-busqueda-post:${ip}`,
    limit: 40,
    windowMs: 60_000,
  });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  const body = (await req.json()) as Body;
  const usuario_id = sanitizeText(body.usuario_id, 80);
  const termino_busqueda = sanitizeText(body.termino_busqueda, 120);
  const categoria_id =
    body.categoria_id == null || sanitizeText(body.categoria_id, 40) === ""
      ? ""
      : sanitizeText(body.categoria_id, 40);

  if (!usuario_id || !termino_busqueda || !isSafeId(usuario_id)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const sql = await getSql();
  if (!sql) {
    return NextResponse.json({ ok: true, persisted: "client" as const });
  }

  try {
    await sql`
      INSERT INTO alertas_busqueda (usuario_id, termino_busqueda, categoria_id)
      VALUES (${usuario_id}, ${termino_busqueda}, ${categoria_id})
      ON CONFLICT (usuario_id, termino_busqueda, categoria_id) DO NOTHING
    `;
    return NextResponse.json({ ok: true, persisted: "database" as const });
  } catch (e) {
    console.error("[alertas-busqueda] POST", e);
    return NextResponse.json(
      { error: "No se pudo guardar en la base de datos" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({
    key: `alertas-busqueda-delete:${ip}`,
    limit: 40,
    windowMs: 60_000,
  });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  const body = (await req.json()) as Body;
  const usuario_id = sanitizeText(body.usuario_id, 80);
  const termino_busqueda = sanitizeText(body.termino_busqueda, 120);
  const categoria_id =
    body.categoria_id == null || sanitizeText(body.categoria_id, 40) === ""
      ? ""
      : sanitizeText(body.categoria_id, 40);

  if (!usuario_id || !termino_busqueda || !isSafeId(usuario_id)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const sql = await getSql();
  if (!sql) {
    return NextResponse.json({ ok: true, persisted: "client" as const });
  }

  try {
    await sql`
      DELETE FROM alertas_busqueda
      WHERE usuario_id = ${usuario_id}
        AND termino_busqueda = ${termino_busqueda}
        AND categoria_id = ${categoria_id}
    `;
    return NextResponse.json({ ok: true, persisted: "database" as const });
  } catch (e) {
    console.error("[alertas-busqueda] DELETE", e);
    return NextResponse.json(
      { error: "No se pudo eliminar en la base de datos" },
      { status: 500 },
    );
  }
}
