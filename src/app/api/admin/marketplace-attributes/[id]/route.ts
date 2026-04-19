import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { deleteAttribute, updateAttribute } from "@/lib/marketplaceTaxonomyStore";
import { requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";

export const runtime = "nodejs";

type PatchBody = {
  label?: string;
  kind?: "yesno" | "tags";
  options?: string[];
  goodAnswer?: "yes" | "no" | null;
  sort_order?: number;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const deny = requireAdminSession(req);
  if (deny) return deny;
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const { id: raw } = await ctx.params;
  const id = sanitizeText(raw, 80);
  if (!id || id.length < 8) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  let options: string[] | null | undefined;
  if (body.options !== undefined) {
    options = Array.isArray(body.options)
      ? body.options.map((o) => sanitizeText(o, 80)).filter(Boolean).slice(0, 24)
      : null;
  }

  try {
    await updateAttribute({
      id,
      label: body.label !== undefined ? sanitizeText(body.label, 300) : undefined,
      kind: body.kind,
      options,
      goodAnswer: body.goodAnswer,
      sort_order: body.sort_order,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL")) {
      return NextResponse.json(
        { error: "Base de datos no configurada." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const deny = requireAdminSession(req);
  if (deny) return deny;
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const { id: raw } = await ctx.params;
  const id = sanitizeText(raw, 80);
  if (!id || id.length < 8) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  try {
    await deleteAttribute(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL")) {
      return NextResponse.json(
        { error: "Base de datos no configurada." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });
  }
}
