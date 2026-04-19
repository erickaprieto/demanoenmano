import { NextResponse } from "next/server";
import { requireTrustedOrigin } from "@/lib/apiSecurity";
import { sessionCookieName } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(sessionCookieName());
  return res;
}
