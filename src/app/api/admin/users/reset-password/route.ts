import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { updateUserPassword } from "@/lib/auth/store";
import { hashPassword } from "@/lib/auth/session";
import { enforceRateLimit, getClientIp, isSafeId, rateLimitExceededResponse, requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";
import { validateUserPassword } from "@/lib/auth/passwordPolicy";

export const runtime = "nodejs";

type Body = {
  userId?: string;
  newPassword?: string;
};

export async function POST(req: Request) {
  const deny = requireAdminSession(req);
  if (deny) return deny;
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({
    key: `admin-reset-password:${ip}`,
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

  const userId = sanitizeText(body.userId, 80);
  if (!userId || !isSafeId(userId)) {
    return NextResponse.json({ error: "userId inválido" }, { status: 400 });
  }

  const provided = sanitizeText(body.newPassword, 120);
  let tempPassword: string;
  if (provided.length > 0) {
    const pwdCheck = validateUserPassword(provided);
    if (!pwdCheck.ok) {
      return NextResponse.json({ error: pwdCheck.error }, { status: 400 });
    }
    tempPassword = provided;
  } else {
    tempPassword = generateTemporaryPassword();
  }
  await updateUserPassword({
    userId,
    passwordHash: hashPassword(tempPassword),
  });

  return NextResponse.json({
    ok: true,
    userId,
    temporaryPassword: tempPassword,
  });
}

function generateTemporaryPassword(): string {
  // Cumple política: ≥10 chars, 1 mayúscula, 1 minúscula, ≥3 dígitos, 1 especial (!#$%&)
  return `A1b2c3!${randomBytes(5).toString("hex")}`;
}
