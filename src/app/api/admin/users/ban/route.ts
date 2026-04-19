import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { setUserBanned } from "@/lib/admin/store";
import { isSafeId, requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const deny = requireAdminSession(req);
  if (deny) return deny;
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  let body: { userId?: string; banned?: boolean };
  try {
    body = (await req.json()) as { userId?: string; banned?: boolean };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const userId = sanitizeText(body.userId, 80);
  const banned = Boolean(body.banned);
  if (!userId || !isSafeId(userId)) {
    return NextResponse.json({ error: "userId inválido" }, { status: 400 });
  }
  await setUserBanned(userId, banned);
  return NextResponse.json({ ok: true });
}
