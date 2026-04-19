import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { insertAttribute, slugifyCategoryId } from "@/lib/marketplaceTaxonomyStore";
import {
  isSafeId,
  requireTrustedOrigin,
  sanitizeText,
} from "@/lib/apiSecurity";

export const runtime = "nodejs";

type Body = {
  categoryId?: string;
  attrKey?: string;
  label?: string;
  kind?: "yesno" | "tags";
  options?: string[];
  goodAnswer?: "yes" | "no" | null;
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

  const categoryId = sanitizeText(body.categoryId, 48);
  const label = sanitizeText(body.label, 300);
  const kind = body.kind === "tags" ? "tags" : "yesno";

  if (!categoryId || !isSafeId(categoryId, 2, 48)) {
    return NextResponse.json({ error: "categoryId inválido" }, { status: 400 });
  }
  if (label.length < 2) {
    return NextResponse.json({ error: "label inválido" }, { status: 400 });
  }

  const attrKey = body.attrKey?.trim()
    ? sanitizeText(body.attrKey, 80)
    : slugifyCategoryId(label);

  if (!isSafeId(attrKey, 2, 80)) {
    return NextResponse.json({ error: "attrKey inválido" }, { status: 400 });
  }

  let options: string[] | null = null;
  if (kind === "tags" && Array.isArray(body.options)) {
    options = body.options
      .map((o) => sanitizeText(o, 80))
      .filter(Boolean)
      .slice(0, 24);
    if (options.length === 0) {
      return NextResponse.json(
        { error: "Atributo tipo lista: indicá al menos una opción." },
        { status: 400 },
      );
    }
  }

  let goodAnswer: "yes" | "no" | null | undefined;
  if (kind === "yesno") {
    if (body.goodAnswer === "yes" || body.goodAnswer === "no") {
      goodAnswer = body.goodAnswer;
    } else if (body.goodAnswer === null || body.goodAnswer === undefined) {
      goodAnswer = null;
    }
  }

  try {
    await insertAttribute({
      categoryId,
      attrKey,
      label,
      kind,
      options,
      goodAnswer: kind === "yesno" ? goodAnswer ?? null : null,
      sort_order: body.sort_order,
    });
    return NextResponse.json({ ok: true, attrKey });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Ya existe un atributo con esa clave en la categoría." },
        { status: 409 },
      );
    }
    if (msg.includes("DATABASE_URL")) {
      return NextResponse.json(
        { error: "Base de datos no configurada." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "No se pudo crear atributo." }, { status: 500 });
  }
}
