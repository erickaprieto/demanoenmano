import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { isSafeId, requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";
import { setPayoutReleaseStatus } from "@/lib/payoutReleaseStore";

export const runtime = "nodejs";

type Body = {
  id?: string;
  decision?: "released" | "pending";
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

  const id = sanitizeText(body.id, 80);
  const decision = body.decision;
  if (!id || !isSafeId(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }
  if (decision !== "released" && decision !== "pending") {
    return NextResponse.json({ error: "Decisión inválida" }, { status: 400 });
  }

  await setPayoutReleaseStatus({ id, status: decision });
  return NextResponse.json({ ok: true });
}
