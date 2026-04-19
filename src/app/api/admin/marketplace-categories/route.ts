import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import {
  insertCategory,
  slugifyCategoryId,
} from "@/lib/marketplaceTaxonomyStore";
import {
  isSafeId,
  requireTrustedOrigin,
  sanitizeText,
} from "@/lib/apiSecurity";

export const runtime = "nodejs";

type Body = {
  id?: string;
  label?: string;
  sort_order?: number;
};

export async function POST(req: Request) {
  const deny = requireAdminSession(req);
  if (deny) return deny;
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const label = sanitizeText(body.label, 120);
  if (label.length < 2) {
    return NextResponse.json({ error: "Etiqueta inválida." }, { status: 400 });
  }

  const rawId = body.id?.trim() ? sanitizeText(body.id, 48) : slugifyCategoryId(label);
  if (!isSafeId(rawId, 2, 48)) {
    return NextResponse.json(
      { error: "id debe ser slug (letras, números, _ y -)." },
      { status: 400 },
    );
  }

  try {
    await insertCategory({
      id: rawId,
      label,
      sort_order: body.sort_order,
    });
    return NextResponse.json({ ok: true, id: rawId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese id." },
        { status: 409 },
      );
    }
    if (msg.includes("DATABASE_URL")) {
      return NextResponse.json(
        { error: "Base de datos no configurada." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "No se pudo crear categoría." }, { status: 500 });
  }
}
