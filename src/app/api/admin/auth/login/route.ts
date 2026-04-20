import { NextResponse } from "next/server";
import { createAdminToken, requireAdminCredentials, adminCookieName } from "@/lib/admin/session";
import {
  cookieSecureFromRequest,
  enforceRateLimit,
  getClientIp,
  rateLimitExceededResponse,
  requireTrustedOrigin,
  sanitizeText,
} from "@/lib/apiSecurity";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;
  const ip = getClientIp(req);
  const rate = enforceRateLimit({ key: `admin-login:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = sanitizeText(body.email, 160).toLowerCase();
  const password = String(body.password ?? "");
  if (!requireAdminCredentials(email, password)) {
    return NextResponse.json({ error: "Credenciales admin inválidas." }, { status: 401 });
  }

  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(adminCookieName(), createAdminToken(email), {
      path: "/",
      httpOnly: true,
      secure: cookieSecureFromRequest(req),
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch {
    return NextResponse.json(
      {
        error:
          "Configuración inválida: revisá AUTH_SESSION_SECRET (mínimo 32 caracteres) y reiniciá el servidor.",
      },
      { status: 500 },
    );
  }
}
