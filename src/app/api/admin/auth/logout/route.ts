import { NextResponse } from "next/server";
import { requireTrustedOrigin } from "@/lib/apiSecurity";
import { adminCookieName } from "@/lib/admin/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(adminCookieName());
  return res;
}
