import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { updateCategory } from "@/lib/marketplaceTaxonomyStore";
import {
  isSafeId,
  requireTrustedOrigin,
  sanitizeText,
} from "@/lib/apiSecurity";

export const runtime = "nodejs";

type Body = {
  label?: string;
  sort_order?: number;
  is_active?: boolean;
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
  const id = sanitizeText(raw, 48);
  if (!id || !isSafeId(id, 2, 48)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  try {
    await updateCategory({
      id,
      label:
        body.label !== undefined ? sanitizeText(body.label, 120) : undefined,
      sort_order:
        typeof body.sort_order === "number" ? body.sort_order : undefined,
      is_active: typeof body.is_active === "boolean" ? body.is_active : undefined,
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
