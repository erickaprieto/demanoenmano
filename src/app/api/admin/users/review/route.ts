import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { isSafeId, requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";
import { setUserApprovalStatus } from "@/lib/auth/store";

export const runtime = "nodejs";

type Body = {
  userId?: string;
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

  const userId = sanitizeText(body.userId, 80);
  const decision = body.decision;
  const reason = sanitizeText(body.reason ?? "", 300);
  if (!userId || !isSafeId(userId)) {
    return NextResponse.json({ error: "userId inválido" }, { status: 400 });
  }
  if (decision !== "approved" && decision !== "rejected") {
    return NextResponse.json({ error: "Decisión inválida" }, { status: 400 });
  }

  await setUserApprovalStatus({
    userId,
    status: decision,
    reason: decision === "rejected" ? reason || "Registro rechazado por administración." : null,
  });
  return NextResponse.json({ ok: true });
}
