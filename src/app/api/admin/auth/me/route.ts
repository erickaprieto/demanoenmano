import { NextResponse } from "next/server";
import { adminCookieName, readCookie, verifyAdminToken } from "@/lib/admin/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = readCookie(req.headers.get("cookie") ?? "", adminCookieName());
  if (!token) return NextResponse.json({ authenticated: false });
  try {
    const payload = verifyAdminToken(token);
    if (!payload) return NextResponse.json({ authenticated: false });
    return NextResponse.json({ authenticated: true, adminEmail: payload.email });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
