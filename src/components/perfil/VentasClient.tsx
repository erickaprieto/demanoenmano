"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Copy } from "lucide-react";
import { checkDeadline, formatDeadlineEsCR } from "@/lib/businessDays";
import { formatColones } from "@/lib/formatColones";
import { processOverdueSellerShipments } from "@/lib/shippingDeadlineEnforcement";
import {
  getDemoOrders,
  setSaleTrackingNumber,
  type BuyerLogisticsSnapshot,
  type DemoOrder,
} from "@/lib/ordersDemo";
import { formatShippingForCorreosPaste } from "@/lib/vibeProfile";
import { PerfilSubLayout } from "./PerfilSubLayout";

function statusLabel(o: DemoOrder) {
  if (o.side === "venta" && o.transactionStatus === "PENDIENTE_PAGO") {
    return "Esperando pago del comprador";
  }
  if (o.status === "pendiente_envio") return "Pendiente de envío";
  if (o.status === "en_camino") return "En camino (Correos)";
  if (o.status === "reembolso_automatico") return "Reintegro al comprador (plazo vencido)";
  return "Entregado";
}

function BuyerLogisticsBlock({ data }: { data: BuyerLogisticsSnapshot }) {
  const text = [
    `Nombre: ${data.full_name}`,
    `Teléfono: ${data.phone}`,
    formatShippingForCorreosPaste(data.shipping_address),
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#1A1A1A] p-3 ring-1 ring-white/[0.04]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        Datos para Correos (visible tras pago)
      </p>
      <dl className="mt-2 space-y-1.5 text-xs text-zinc-300">
        <div>
          <dt className="text-zinc-600">Nombre</dt>
          <dd className="font-medium text-white">{data.full_name}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Teléfono</dt>
          <dd className="font-mono text-zinc-200">{data.phone}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Dirección</dt>
          <dd className="leading-relaxed">
            {data.shipping_address.provincia}, {data.shipping_address.canton}
            {data.shipping_address.distrito
              ? `, ${data.shipping_address.distrito}`
              : ""}
            <br />
            {data.shipping_address.direccion_exacta}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={() => void copy()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-electric/40 bg-violet-electric/15 py-2.5 text-xs font-semibold text-violet-electric transition hover:bg-violet-electric/25"
      >
        <Copy className="size-4" strokeWidth={2} />
        Copiar para Boleta de Correos
      </button>
    </div>
  );
}

type VentasClientProps = {
  embedded?: boolean;
};

export function VentasClient({ embedded = false }: VentasClientProps) {
  const formId = useId();
  const [orders, setOrders] = useState<DemoOrder[]>(() =>
    typeof window === "undefined"
      ? []
      : getDemoOrders().filter((o) => o.side === "venta"),
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingShipping, setSavingShipping] = useState<Record<string, boolean>>({});
  const [trackFormOpen, setTrackFormOpen] = useState<Record<string, boolean>>({});
  const [shippingMsg, setShippingMsg] = useState<Record<string, string>>({});

  const refresh = useCallback(() => {
    setOrders(getDemoOrders().filter((o) => o.side === "venta"));
  }, []);

  useEffect(() => {
    const on = () => refresh();
    window.addEventListener("vibe-demo-orders-updated", on);
    return () => window.removeEventListener("vibe-demo-orders-updated", on);
  }, [refresh]);

  useEffect(() => {
    processOverdueSellerShipments();
  }, []);

  const list = (
    <>
      {!embedded ? (
        <p className="mb-6 text-sm leading-relaxed text-zinc-500">
          Cuando el comprador pague, verás su dirección para Correos. El plazo
          de 3 días hábiles para registrar guía arranca desde la confirmación de
          pago. Al guardar la guía en De Mano en Mano se libera el pago al vendedor según
          las reglas de la plataforma.
        </p>
      ) : null}
      <ul className="space-y-4">
        {orders.map((o) => {
          const isPaid = o.transactionStatus === "PAGADO";
          const anchor = o.paidAt ? new Date(o.paidAt) : new Date(o.orderedAt);
          const deadlineRow =
            isPaid &&
            o.status === "pendiente_envio" &&
            !o.shippingSanctionApplied &&
            o.paidAt
              ? checkDeadline(anchor)
              : null;

          return (
            <li
              key={o.id}
              className="rounded-2xl border border-white/[0.06] bg-obsidian-elevated/80 p-4 ring-1 ring-white/[0.04]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{o.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{o.counterpartyHint}</p>
                </div>
                <p className="font-mono text-sm text-neon-green">
                  ₡{formatColones(o.amountColones)}
                </p>
              </div>
              <p className="mt-2 text-[11px] text-zinc-600">{statusLabel(o)}</p>
              {o.transactionStatus === "PENDIENTE_PAGO" ? (
                <p
                  className="mt-3 rounded-lg border border-white/[0.06] bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400"
                  role="status"
                >
                  🔒 Datos de envío protegidos
                </p>
              ) : isPaid && o.buyerLogistics ? (
                <BuyerLogisticsBlock data={o.buyerLogistics} />
              ) : null}
              {deadlineRow ? (
                <p className="mt-3 text-[11px] text-zinc-500">
                  Plazo guía (3 días hábiles desde el pago):{" "}
                  <span className="font-medium text-zinc-300">
                    {formatDeadlineEsCR(deadlineRow.deadline)}
                  </span>
                  {deadlineRow.isExpired ? (
                    <span className="ml-1 font-semibold text-[#FF4B4B]">
                      · vencido
                    </span>
                  ) : null}
                </p>
              ) : null}
              {o.status === "reembolso_automatico" && o.refundedToBuyerAt ? (
                <p className="mt-2 text-xs text-amber-200/90">
                  Reintegro automático del 100% al comprador (demo) —{" "}
                  {new Date(o.refundedToBuyerAt).toLocaleString("es-CR")}
                </p>
              ) : null}
              {o.trackingNumber ? (
                <p className="mt-3 text-xs text-zinc-400">
                  Guía registrada:{" "}
                  <span className="font-mono text-zinc-200">{o.trackingNumber}</span>
                </p>
              ) : o.status === "pendiente_envio" && isPaid ? (
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    Cargá la guía acá cuando la tengas: es el paso que dispara la
                    liberación del pago con el pago seguro De Mano en Mano.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setTrackFormOpen((prev) => ({ ...prev, [o.id]: !prev[o.id] }))
                    }
                    className="w-full rounded-2xl bg-neon-green py-3.5 text-sm font-bold tracking-tight text-black shadow-[0_0_36px_-6px_rgba(51,255,0,0.55)] transition hover:brightness-110 active:scale-[0.99]"
                  >
                    Subir Número de Rastreo
                  </button>
                  {trackFormOpen[o.id] ? (
                    <div className="space-y-2 rounded-xl border border-white/[0.08] bg-obsidian p-3">
                      <label
                        htmlFor={`${formId}-track-${o.id}`}
                        className="text-xs font-medium text-zinc-400"
                      >
                        Pegá el código de guía (ej. CR123456789CR)
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          id={`${formId}-track-${o.id}`}
                          value={drafts[o.id] ?? ""}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [o.id]: e.target.value }))
                          }
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#141414] px-3 py-2 font-mono text-sm text-white outline-none focus:border-neon-green/60"
                          placeholder="CR123456789CR"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const v = (drafts[o.id] ?? "").trim();
                            if (!v) {
                              setShippingMsg((prev) => ({
                                ...prev,
                                [o.id]: "Ingresá un número de rastreo válido.",
                              }));
                              return;
                            }
                            setSavingShipping((prev) => ({ ...prev, [o.id]: true }));
                            setShippingMsg((prev) => ({ ...prev, [o.id]: "" }));
                            try {
                              const res = await fetch("/api/shippings/register", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  orderId: o.id,
                                  trackingNumber: v,
                                  carrier: "Correos de Costa Rica",
                                }),
                              });
                              if (!res.ok) {
                                const data = (await res.json().catch(() => ({}))) as {
                                  error?: string;
                                };
                                setShippingMsg((prev) => ({
                                  ...prev,
                                  [o.id]:
                                    data.error ??
                                    "No se pudo registrar guía en base de datos.",
                                }));
                                return;
                              }
                              setSaleTrackingNumber(o.id, v);
                              setTrackFormOpen((prev) => ({ ...prev, [o.id]: false }));
                              setShippingMsg((prev) => ({
                                ...prev,
                                [o.id]:
                                  "Guía subida. Admin ya fue notificado para liberar fondos manualmente.",
                              }));
                              refresh();
                            } catch {
                              setShippingMsg((prev) => ({
                                ...prev,
                                [o.id]: "Error de red al registrar guía.",
                              }));
                            } finally {
                              setSavingShipping((prev) => ({ ...prev, [o.id]: false }));
                            }
                          }}
                          disabled={Boolean(savingShipping[o.id])}
                          className="shrink-0 rounded-xl bg-violet-electric px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                        >
                          {savingShipping[o.id] ? "Guardando..." : "Confirmar guía"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {shippingMsg[o.id] ? (
                    <p className="text-xs text-zinc-400">{shippingMsg[o.id]}</p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );

  if (embedded) {
    return <div className="pb-2">{list}</div>;
  }

  return <PerfilSubLayout title="Mis ventas">{list}</PerfilSubLayout>;
}
