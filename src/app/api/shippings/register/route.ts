import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitExceededResponse,
  requireTrustedOrigin,
  sanitizeText,
} from "@/lib/apiSecurity";
import { getSessionFromRequest } from "@/lib/auth/session";
import { enqueuePayoutRelease } from "@/lib/payoutReleaseStore";
import { upsertShippingForOrder } from "@/lib/shippingsStore";

export const runtime = "nodejs";

type Body = {
  orderId?: string;
  trackingNumber?: string;
  carrier?: string;
};

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const rate = enforceRateLimit({
    key: `shipping-register:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const orderId = sanitizeText(body.orderId, 80);
  const trackingNumber = sanitizeText(body.trackingNumber, 80).toUpperCase();
  const carrier = sanitizeText(body.carrier, 80) || "Correos de Costa Rica";
  if (!orderId || orderId.length < 4) {
    return NextResponse.json({ error: "orderId inválido." }, { status: 400 });
  }
  if (!trackingNumber || trackingNumber.length < 6) {
    return NextResponse.json(
      { error: "Número de rastreo inválido." },
      { status: 400 },
    );
  }

  const row = await upsertShippingForOrder({
    id: randomUUID(),
    orderId,
    sellerUserId: session.userId,
    trackingNumber,
    carrier,
  });

  if (!row) {
    return NextResponse.json(
      { error: "No se pudo guardar envío (revisá DATABASE_URL)." },
      { status: 503 },
    );
  }
  await enqueuePayoutRelease({
    id: randomUUID(),
    orderId,
    sellerUserId: session.userId,
    trackingNumber,
  });

  return NextResponse.json({
    ok: true,
    shipping: row,
  });
}
