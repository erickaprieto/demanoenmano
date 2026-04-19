import { NextResponse } from "next/server";
import { sessionCookieName, verifySessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const token = readCookie(cookieHeader, sessionCookieName());
  if (!token) return NextResponse.json({ authenticated: false });

  try {
    const payload = verifySessionToken(token);
    if (!payload) return NextResponse.json({ authenticated: false });
    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        fullName: payload.fullName,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

function readCookie(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(";").map((v) => v.trim());
  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) continue;
    return decodeURIComponent(part.slice(name.length + 1));
  }
  return null;
}
