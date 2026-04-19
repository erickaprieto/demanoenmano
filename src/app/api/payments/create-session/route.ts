import { NextResponse } from "next/server";
import { createCuantoCheckoutSession } from "@/lib/payments/cuanto/session";
import {
  enforceRateLimit,
  getClientIp,
  requireTrustedOrigin,
  rateLimitExceededResponse,
  tryParseAppUrl,
} from "@/lib/apiSecurity";
import { SWIPE_PRODUCTS } from "@/data/swipeProducts";
import { shippingColonesForTier } from "@/lib/checkoutShipping";

export type CreatePaymentSessionBody = {
  orderId: string;
  amountColones: number;
  description?: string;
  listingId?: string;
  weightTier?: string | null;
};

/** Crea sesión de checkout en Cuanto y devuelve URL de redirección. */
export async function POST(request: Request) {
  const badOrigin = requireTrustedOrigin(request);
  if (badOrigin) return badOrigin;

  const ip = getClientIp(request);
  const rate = enforceRateLimit({
    key: `payments-create-session:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: Partial<CreatePaymentSessionBody> = {};
  try {
    body = (await request.json()) as CreatePaymentSessionBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (
    !body.orderId ||
    typeof body.amountColones !== "number" ||
    !Number.isInteger(body.amountColones) ||
    body.amountColones < 500 ||
    body.amountColones > 50_000_000
  ) {
    return NextResponse.json(
      { error: "Datos de pago inválidos" },
      { status: 400 },
    );
  }

  if (!isKnownOrderId(body.orderId)) {
    return NextResponse.json({ error: "orderId inválido" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const listing = SWIPE_PRODUCTS.find((p) => p.id === listingId);
  if (!listing) {
    return NextResponse.json(
      { error: "No se pudo validar el artículo para el pago." },
      { status: 400 },
    );
  }

  const shipping = shippingColonesForTier(body.weightTier ?? null);
  const transactionFee = Math.round(listing.priceColones * 0.049 + 225);
  const expectedTotal = listing.priceColones + shipping + transactionFee;
  if (expectedTotal !== body.amountColones) {
    return NextResponse.json(
      { error: "El monto del pago no coincide con el cálculo seguro del servidor." },
      { status: 400 },
    );
  }

  const base = tryParseAppUrl(process.env.APP_URL) ?? new URL(request.url);
  const successUrl = `${base.origin}/checkout/pago-exito?orderId=${encodeURIComponent(body.orderId)}&source=cuanto`;

  const session = await createCuantoCheckoutSession({
    orderId: body.orderId,
    amountColones: expectedTotal,
    description: body.description ?? listing.name,
    successUrl,
  });
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: 503 });
  }
  return NextResponse.json({
    provider: "cuanto" as const,
    redirectUrl: session.redirectUrl,
  });
}

function isKnownOrderId(orderId: string): boolean {
  const value = orderId.trim();
  return value.length >= 8 && value.length <= 80 && /^[a-zA-Z0-9_-]+$/.test(value);
}
