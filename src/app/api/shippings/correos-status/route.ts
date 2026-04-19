import { NextResponse } from "next/server";
import { sanitizeText } from "@/lib/apiSecurity";
import { buildTrackingTimeline, type DemoOrderStatus } from "@/lib/shippingTracking";

export const runtime = "nodejs";

const ALLOWED_ORDER_STATUS = new Set<DemoOrderStatus>([
  "pendiente_envio",
  "en_camino",
  "entregado",
  "reembolso_automatico",
]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const trackingNumber = sanitizeText(url.searchParams.get("tracking"), 80);
  const statusRaw = sanitizeText(url.searchParams.get("orderStatus"), 30) as DemoOrderStatus;
  if (!trackingNumber) {
    return NextResponse.json({ error: "tracking requerido" }, { status: 400 });
  }
  if (!ALLOWED_ORDER_STATUS.has(statusRaw)) {
    return NextResponse.json({ error: "orderStatus inválido" }, { status: 400 });
  }

  // Integración opcional con API externa de Correos CR (si existe/configurada).
  const providerUrl = process.env.CORREOS_TRACKING_API_URL?.trim();
  const providerKey = process.env.CORREOS_TRACKING_API_KEY?.trim();
  if (providerUrl && providerKey) {
    try {
      const target = new URL(providerUrl);
      target.searchParams.set("tracking", trackingNumber);
      const res = await fetch(target.toString(), {
        headers: {
          Authorization: `Bearer ${providerKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
      if (res.ok) {
        const payload = (await res.json()) as { events?: unknown[] };
        return NextResponse.json({
          ok: true,
          source: "correos_api",
          raw: payload,
          timeline: buildTrackingTimeline({
            orderStatus: statusRaw,
            trackingNumber,
          }),
        });
      }
    } catch {
      // Fallback demo abajo.
    }
  }

  return NextResponse.json({
    ok: true,
    source: "demo",
    timeline: buildTrackingTimeline({
      orderStatus: statusRaw,
      trackingNumber,
    }),
  });
}
