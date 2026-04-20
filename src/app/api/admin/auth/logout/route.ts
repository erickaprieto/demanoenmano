import { NextResponse } from "next/server";
import { cookieSecureFromRequest, requireTrustedOrigin } from "@/lib/apiSecurity";
import { adminCookieName } from "@/lib/admin/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;
  const res = NextResponse.json({ ok: true });
  const secure = cookieSecureFromRequest(req);
  res.cookies.set(adminCookieName(), "", {
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 0,
  });
  return res;
}
