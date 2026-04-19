import { NextResponse } from "next/server";
import { consumePasswordResetToken, hashResetToken, updateUserPassword } from "@/lib/auth/store";
import { hashPassword } from "@/lib/auth/session";
import { enforceRateLimit, getClientIp, rateLimitExceededResponse, requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";
import { validateUserPassword } from "@/lib/auth/passwordPolicy";

export const runtime = "nodejs";

type Body = {
  token?: string;
  password?: string;
};

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({ key: `auth-reset:${ip}`, limit: 15, windowMs: 60_000 });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const token = sanitizeText(body.token, 180);
  const password = String(body.password ?? "");
  if (!token) {
    return NextResponse.json({ error: "Token inválido." }, { status: 400 });
  }
  const pwdCheck = validateUserPassword(password);
  if (!pwdCheck.ok) {
    return NextResponse.json({ error: pwdCheck.error }, { status: 400 });
  }

  const consumed = await consumePasswordResetToken(hashResetToken(token));
  if (!consumed) {
    return NextResponse.json({ error: "Token inválido o vencido." }, { status: 400 });
  }

  await updateUserPassword({
    userId: consumed.userId,
    passwordHash: hashPassword(password),
  });
  return NextResponse.json({ ok: true });
}
