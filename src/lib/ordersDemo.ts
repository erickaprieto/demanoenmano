import { checkDeadline } from "@/lib/businessDays";
import { markListingSoldFromCheckout } from "@/lib/soldListings";
import { buildBuyerLogisticsSnapshot } from "@/lib/vibeProfile";

const STORAGE_KEY = "vibe:demoOrders:v3";
const LEGACY_KEYS = ["vibe:demoOrders:v2", "vibe:demoOrders:v1"] as const;

export type DemoOrderStatus =
  | "pendiente_envio"
  | "en_camino"
  | "entregado"
  | "reembolso_automatico";

/** Estado de pago en ventas (revela datos del comprador solo en PAGADO). */
export type TransactionPaymentStatus = "PENDIENTE_PAGO" | "PAGADO";

export type BuyerLogisticsSnapshot = {
  full_name: string;
  phone: string;
  shipping_address: {
    provincia: string;
    canton: string;
    distrito: string;
    codigo_postal: string;
    direccion_exacta: string;
  };
};

export type DemoOrder = {
  id: string;
  side: "venta" | "compra";
  title: string;
  amountColones: number;
  status: DemoOrderStatus;
  trackingNumber?: string;
  counterpartyHint: string;
  orderedAt: string;
  shippingDeadlineAt?: string;
  shippingSanctionApplied?: boolean;
  refundedToBuyerAt?: string;
  transactionStatus?: TransactionPaymentStatus;
  /** Inicia el plazo de 3 días hábiles para guía (solo venta + PAGADO). */
  paidAt?: string;
  buyerLogistics?: BuyerLogisticsSnapshot | null;
};

function shippingAnchor(o: DemoOrder): Date | null {
  if (o.side !== "venta") return null;
  if (o.transactionStatus === "PENDIENTE_PAGO") return null;
  const raw = o.paidAt ?? o.orderedAt;
  return raw ? new Date(raw) : null;
}

function withDeadline(o: DemoOrder): DemoOrder {
  if (o.side !== "venta") return o;
  if (o.transactionStatus === "PENDIENTE_PAGO") {
    return {
      ...o,
      buyerLogistics: null,
      paidAt: undefined,
      shippingDeadlineAt: undefined,
    };
  }
  if (o.shippingDeadlineAt) return o;
  const anchor = shippingAnchor(o);
  if (!anchor) return o;
  const { deadline } = checkDeadline(anchor);
  return { ...o, shippingDeadlineAt: deadline.toISOString() };
}

function migrateOrderRow(o: DemoOrder): DemoOrder {
  if (o.side === "venta" && !o.transactionStatus) {
    if (o.status === "pendiente_envio" && !o.trackingNumber) {
      return withDeadline({
        ...o,
        transactionStatus: "PENDIENTE_PAGO",
        buyerLogistics: null,
      });
    }
    return withDeadline({
      ...o,
      transactionStatus: "PAGADO",
      paidAt: o.paidAt ?? o.orderedAt,
      buyerLogistics: o.buyerLogistics ?? {
        full_name: "Comprador verificado",
        phone: "+506 **** ****",
        shipping_address: {
          provincia: "San José",
          canton: "Central",
          distrito: "Catedral",
          codigo_postal: "10101",
          direccion_exacta: "De la esquina norte, 100 m oeste (demo)",
        },
      },
    });
  }
  return withDeadline({ ...o });
}

function seedOrders(): DemoOrder[] {
  const t = new Date().toISOString();
  const paidEarlier = new Date(Date.now() - 5 * 86400000).toISOString();
  const base: DemoOrder[] = [
    {
      id: "demo-v-1",
      side: "venta",
      title: "Chaqueta denim vintage",
      amountColones: 48_000,
      status: "pendiente_envio",
      counterpartyHint: "Comprador verificado · ****82",
      orderedAt: t,
      transactionStatus: "PENDIENTE_PAGO",
      buyerLogistics: null,
    },
    {
      id: "demo-v-2",
      side: "venta",
      title: "Sudadera oversize gris",
      amountColones: 22_000,
      status: "en_camino",
      trackingNumber: "CR123456789CR",
      counterpartyHint: "Comprador verificado · ****15",
      orderedAt: t,
      transactionStatus: "PAGADO",
      paidAt: paidEarlier,
      buyerLogistics: {
        full_name: "María Rojas",
        phone: "+506 8888-2211",
        shipping_address: {
          provincia: "Alajuela",
          canton: "Alajuela",
          distrito: "Alajuela",
          codigo_postal: "20101",
          direccion_exacta: "Contiguo al parque central, portón verde (demo)",
        },
      },
    },
    {
      id: "demo-c-1",
      side: "compra",
      title: "Cámara mirrorless",
      amountColones: 185_000,
      status: "en_camino",
      trackingNumber: "CR887766554CR",
      counterpartyHint: "Vendedor verificado · ****40",
      orderedAt: t,
    },
  ];
  return base.map(migrateOrderRow);
}

function normalizeFromStorage(list: DemoOrder[]): DemoOrder[] {
  return list.map((o) => migrateOrderRow({ ...o }));
}

function tryMigrateLegacy(): DemoOrder[] | null {
  if (typeof window === "undefined") return null;
  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const list = JSON.parse(raw) as DemoOrder[];
      if (Array.isArray(list) && list.length > 0) {
        const normalized = normalizeFromStorage(list);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch {
      /* skip */
    }
  }
  return null;
}

export function getDemoOrders(): DemoOrder[] {
  if (typeof window === "undefined") return seedOrders();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw) as DemoOrder[];
      if (Array.isArray(list) && list.length > 0) {
        return normalizeFromStorage(list);
      }
    }
    const migrated = tryMigrateLegacy();
    if (migrated) return migrated;
    const seed = seedOrders();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch {
    return seedOrders();
  }
}

export function saveDemoOrders(orders: DemoOrder[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("vibe-demo-orders-updated"));
}

export function setSaleTrackingNumber(orderId: string, tracking: string): void {
  const trimmed = tracking.trim();
  if (!trimmed) return;
  const orders = getDemoOrders().map((o) =>
    o.id === orderId &&
    o.side === "venta" &&
    o.status === "pendiente_envio" &&
    !o.shippingSanctionApplied
      ? {
          ...o,
          trackingNumber: trimmed,
          status: "en_camino" as DemoOrderStatus,
        }
      : o,
  );
  saveDemoOrders(orders);
}

/**
 * Tras confirmar pago en checkout (demo): marca venta PAGADO, fija paidAt y datos del comprador.
 * El plazo de 3 días hábiles para guía arranca desde `paidAt`.
 */
export function confirmCheckoutPaymentDemo(input: {
  title: string;
  amountColones: number;
  /** Si venís del feed swipe, marcamos el listado como vendido (no vuelve al deck). */
  listingId?: string | null;
}): boolean {
  const snap = buildBuyerLogisticsSnapshot();
  if (!snap) return false;
  const orders = getDemoOrders();
  const titleNeedle = input.title.trim().toLowerCase();
  let idx = orders.findIndex(
    (o) =>
      o.side === "venta" &&
      o.transactionStatus === "PENDIENTE_PAGO" &&
      o.title.toLowerCase().includes(titleNeedle),
  );
  if (idx < 0) {
    idx = orders.findIndex(
      (o) => o.side === "venta" && o.transactionStatus === "PENDIENTE_PAGO",
    );
  }
  if (idx < 0) return false;
  const paidAt = new Date().toISOString();
  const next = orders.map((o, i) =>
    i === idx
      ? withDeadline(
          migrateOrderRow({
            ...o,
            transactionStatus: "PAGADO",
            paidAt,
            buyerLogistics: snap,
            shippingDeadlineAt: undefined,
          }),
        )
      : o,
  );
  saveDemoOrders(next);
  markListingSoldFromCheckout({
    listingId: input.listingId,
    title: input.title,
  });
  return true;
}
