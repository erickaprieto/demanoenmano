import { NextResponse } from "next/server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitExceededResponse,
  requireModerationApiToken,
  requireTrustedOrigin,
} from "@/lib/apiSecurity";

export const runtime = "nodejs";

type Body = {
  strikes_envio?: number;
  is_permanently_banned?: boolean;
  temp_ban_until?: string | null;
};

/** Sincroniza cookies leídas por `middleware` (estado de baneos / strikes). */
export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const unauthorized = requireModerationApiToken(req);
  if (unauthorized) return unauthorized;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({
    key: `moderation-cookies:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const perm = Boolean(body.is_permanently_banned);
  const temp =
    body.temp_ban_until == null || String(body.temp_ban_until).trim() === ""
      ? null
      : String(body.temp_ban_until).trim();

  const res = NextResponse.json({ ok: true });

  if (perm) {
    res.cookies.set("vibe_permaban", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 3650,
      sameSite: "lax",
      httpOnly: true,
      secure: true,
    });
    res.cookies.delete("vibe_temp_ban_until");
  } else if (temp) {
    res.cookies.set("vibe_temp_ban_until", temp, {
      path: "/",
      maxAge: 60 * 60 * 24 * 8,
      sameSite: "lax",
      httpOnly: true,
      secure: true,
    });
    res.cookies.delete("vibe_permaban");
  } else {
    res.cookies.delete("vibe_temp_ban_until");
    res.cookies.delete("vibe_permaban");
  }

  return res;
}
