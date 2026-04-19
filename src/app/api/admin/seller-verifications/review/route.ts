import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { isSafeId, requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";
import { reviewSellerVerification } from "@/lib/sellerVerification";

export const runtime = "nodejs";

type Body = {
  id?: string;
  decision?: "approved" | "rejected";
  reason?: string | null;
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
  const id = sanitizeText(body.id, 120);
  const decision = body.decision;
  const reason = body.reason == null ? null : sanitizeText(body.reason, 220);
  if (!id || !isSafeId(id, 5, 120) || (decision !== "approved" && decision !== "rejected")) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  if (decision === "rejected" && !reason) {
    return NextResponse.json({ error: "Agregá motivo de rechazo." }, { status: 400 });
  }
  await reviewSellerVerification({
    id,
    status: decision,
    rejectReason: decision === "rejected" ? reason : null,
  });
  return NextResponse.json({ ok: true });
}
