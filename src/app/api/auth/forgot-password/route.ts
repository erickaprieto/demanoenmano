import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createPasswordResetToken, findUserByEmail, hashResetToken } from "@/lib/auth/store";
import { enforceRateLimit, getClientIp, rateLimitExceededResponse, requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";

export const runtime = "nodejs";

type Body = {
  email?: string;
};

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({ key: `auth-forgot:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = sanitizeText(body.email, 160).toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Ingresá un correo válido." }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const plainToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 20).toISOString();
  await createPasswordResetToken({
    userId: user.id,
    tokenHash: hashResetToken(plainToken),
    expiresAtIso: expiresAt,
  });

  // TODO producción: enviar correo con proveedor transaccional.
  return NextResponse.json({
    ok: true,
    ...(process.env.NODE_ENV !== "production"
      ? { devResetToken: plainToken, expiresAt }
      : {}),
  });
}
