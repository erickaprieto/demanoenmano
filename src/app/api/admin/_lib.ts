import { NextResponse } from "next/server";
import { adminCookieName, readCookie, verifyAdminToken } from "@/lib/admin/session";

export function requireAdminSession(request: Request): Response | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = readCookie(cookieHeader, adminCookieName());
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const payload = verifyAdminToken(token);
    if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    return null;
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}
