import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createPendingUserApproval, createUser, findUserByEmail } from "@/lib/auth/store";
import { hashPassword } from "@/lib/auth/session";
import { enforceRateLimit, getClientIp, rateLimitExceededResponse, requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";
import { validateUserPassword } from "@/lib/auth/passwordPolicy";

export const runtime = "nodejs";

type Body = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
};

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({ key: `auth-signup:${ip}`, limit: 15, windowMs: 60_000 });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const fullName = sanitizeText(body.fullName, 120);
  const email = sanitizeText(body.email, 160).toLowerCase();
  const phone = sanitizeText(body.phone, 30);
  const password = String(body.password ?? "");

  if (fullName.length < 3 || !validEmail(email) || phone.length < 8) {
    return NextResponse.json({ error: "Datos inválidos para registro." }, { status: 400 });
  }
  const pwdCheck = validateUserPassword(password);
  if (!pwdCheck.ok) {
    return NextResponse.json({ error: pwdCheck.error }, { status: 400 });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "Ese correo ya está registrado." }, { status: 409 });
  }

  const user = await createUser({
    id: randomUUID(),
    email,
    fullName,
    phone,
    passwordHash: hashPassword(password),
  });
  await createPendingUserApproval(user.id);

  return NextResponse.json({
    ok: true,
    requiresApproval: true,
    message: "Registro recibido. Tu cuenta debe ser aprobada por el administrador antes de iniciar sesión.",
    user: { id: user.id, email: user.email, fullName: user.fullName },
  });
}
