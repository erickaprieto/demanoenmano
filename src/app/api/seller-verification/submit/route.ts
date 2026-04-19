import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { enforceRateLimit, getClientIp, rateLimitExceededResponse, requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";
import { upsertSellerVerification } from "@/lib/sellerVerification";

export const runtime = "nodejs";

type Body = {
  cedula?: string;
  iban?: string;
  selfieImageDataUrl?: string;
  selfieMimeType?: string;
  selfieSizeBytes?: number;
  selfieWidth?: number;
  selfieHeight?: number;
};

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const ip = getClientIp(req);
  const rate = enforceRateLimit({ key: `seller-verification-submit:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const cedula = sanitizeText(body.cedula, 40);
  const iban = sanitizeText(body.iban, 80).replace(/\s/g, "");
  const selfieImageDataUrl = sanitizeText(body.selfieImageDataUrl, 2_200_000);
  const selfieMimeType = sanitizeText(body.selfieMimeType, 40).toLowerCase();
  const selfieSizeBytes = Number(body.selfieSizeBytes ?? 0);
  const selfieWidth = Number(body.selfieWidth ?? 0);
  const selfieHeight = Number(body.selfieHeight ?? 0);

  const checks: string[] = [];
  if (cedula.length < 5) checks.push("cedula_invalida");
  if (iban.length < 12 || !iban.startsWith("CR")) checks.push("iban_invalido");
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(selfieImageDataUrl)) {
    checks.push("selfie_formato_invalido");
  }
  if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(selfieMimeType)) {
    checks.push("selfie_mime_invalido");
  }
  if (selfieSizeBytes < 80_000 || selfieSizeBytes > 4_500_000) {
    checks.push("selfie_tamano_invalido");
  }
  if (selfieWidth < 720 || selfieHeight < 960) {
    checks.push("selfie_resolucion_baja");
  }
  if (selfieHeight < selfieWidth) {
    checks.push("selfie_orientacion_incorrecta");
  }
  const status = checks.length === 0 ? "pending" : "rejected";

  const requestId = `${session.userId}-seller-kyc`;
  await upsertSellerVerification({
    id: requestId,
    userId: session.userId,
    fullName: session.fullName,
    email: session.email,
    cedula,
    iban,
    selfieImageDataUrl,
    selfieMimeType,
    selfieSizeBytes,
    selfieWidth,
    selfieHeight,
    status,
    autoChecks: checks,
    rejectReason:
      status === "rejected"
        ? "La imagen no cumple validaciones automáticas. Revisá calidad, tamaño y orientación."
        : null,
  });

  return NextResponse.json({
    ok: true,
    status,
    autoChecks: checks,
    requestId: requestId || randomUUID(),
  });
}
