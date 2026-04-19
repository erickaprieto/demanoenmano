import { checkDeadline } from "@/lib/businessDays";
import { applyShippingStrikeViolation } from "@/lib/legalProfile";
import {
  getDemoOrders,
  saveDemoOrders,
  type DemoOrder,
} from "@/lib/ordersDemo";

async function applyStrikesSequential(count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await applyShippingStrikeViolation();
  }
}

export function processOverdueSellerShipments(): void {
  void processOverdueSellerShipmentsInner();
}

async function processOverdueSellerShipmentsInner(): Promise<void> {
  if (typeof window === "undefined") return;
  const orders = getDemoOrders();
  let changed = false;
  let newSanctions = 0;
  const next: DemoOrder[] = orders.map((o) => {
    if (o.side !== "venta") return o;
    if (o.transactionStatus !== "PAGADO") return o;
    if (o.status !== "pendiente_envio") return o;
    if (o.trackingNumber?.trim()) return o;
    if (o.shippingSanctionApplied) return o;

    const anchor = o.paidAt ? new Date(o.paidAt) : new Date(o.orderedAt);
    const { deadline, isExpired } = checkDeadline(anchor);
    const deadlineIso = deadline.toISOString();

    if (!isExpired) {
      if (!o.shippingDeadlineAt) {
        changed = true;
        return { ...o, shippingDeadlineAt: deadlineIso };
      }
      return o;
    }

    newSanctions += 1;
    changed = true;
    return {
      ...o,
      shippingDeadlineAt: deadlineIso,
      status: "reembolso_automatico",
      refundedToBuyerAt: new Date().toISOString(),
      shippingSanctionApplied: true,
    };
  });

  if (!changed) return;
  saveDemoOrders(next);
  if (newSanctions > 0) {
    await applyStrikesSequential(newSanctions);
  }
}
