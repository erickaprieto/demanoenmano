import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieName, verifyPassword } from "@/lib/auth/session";
import { findUserByEmail, getUserApprovalStatus } from "@/lib/auth/store";
import { enforceRateLimit, getClientIp, rateLimitExceededResponse, requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";

export const runtime = "nodejs";

type Body = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({ key: `auth-login:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = sanitizeText(body.email, 160).toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ error: "Ingresá correo y contraseña." }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }
  const approval = await getUserApprovalStatus(user.id);
  if (approval?.status === "rejected") {
    return NextResponse.json(
      {
        error:
          approval.reason?.trim() ||
          "Tu registro fue rechazado. Contactá al administrador para más detalles.",
      },
      { status: 403 },
    );
  }

  const token = createSessionToken({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  });

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, fullName: user.fullName },
  });
  res.cookies.set(sessionCookieName(), token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
