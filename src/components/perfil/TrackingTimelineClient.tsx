"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { getDemoOrders, type DemoOrder } from "@/lib/ordersDemo";
import type { TrackingStep } from "@/lib/shippingTracking";
import { PerfilSubLayout } from "./PerfilSubLayout";

type Props = {
  orderId: string;
};

function statusBadgeClass(step: TrackingStep): string {
  if (step.completed) {
    return "border-neon-green/60 bg-neon-green/15 text-neon-green shadow-[0_0_24px_-8px_rgba(57,255,20,0.95)]";
  }
  if (step.current) {
    return "border-violet-electric/50 bg-violet-electric/12 text-violet-100";
  }
  return "border-white/15 bg-obsidian text-zinc-500";
}

export function TrackingTimelineClient({ orderId }: Props) {
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [timeline, setTimeline] = useState<TrackingStep[]>([]);
  const [source, setSource] = useState<"demo" | "correos_api">("demo");

  useEffect(() => {
    const found = getDemoOrders().find((o) => o.side === "compra" && o.id === orderId) ?? null;
    setOrder(found);
  }, [orderId]);

  useEffect(() => {
    if (!order?.trackingNumber) return;
    void fetch(
      `/api/shippings/correos-status?tracking=${encodeURIComponent(order.trackingNumber)}&orderStatus=${encodeURIComponent(order.status)}`,
    )
      .then((r) => r.json())
      .then((d: { timeline?: TrackingStep[]; source?: "demo" | "correos_api" }) => {
        setTimeline(Array.isArray(d.timeline) ? d.timeline : []);
        setSource(d.source === "correos_api" ? "correos_api" : "demo");
      })
      .catch(() => {
        setTimeline([]);
      });
  }, [order]);

  const hasTracking = Boolean(order?.trackingNumber);
  const title = useMemo(() => order?.title ?? "Rastreo de pedido", [order?.title]);

  if (!order) {
    return (
      <PerfilSubLayout title="Rastreo">
        <p className="text-sm text-zinc-400">No encontramos ese pedido.</p>
      </PerfilSubLayout>
    );
  }

  return (
    <PerfilSubLayout title="Rastreo de envío">
      <Link
        href="/perfil/compras"
        className="mb-4 inline-flex items-center gap-2 text-xs text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Volver a compras
      </Link>

      <div className="rounded-2xl border border-white/[0.06] bg-obsidian-elevated/80 p-4 ring-1 ring-white/[0.04]">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">
          Guía:{" "}
          <span className="font-mono text-zinc-300">
            {order.trackingNumber ?? "Pendiente"}
          </span>
        </p>
        <p className="mt-1 text-[11px] text-zinc-600">
          Fuente de estado: {source === "correos_api" ? "API Correos CR" : "Timeline integrada (demo)"}
        </p>
      </div>

      {!hasTracking ? (
        <p className="mt-4 rounded-xl border border-violet-electric/25 bg-violet-electric/10 px-3 py-2 text-xs text-violet-100">
          El vendedor todavía no sube la guía. Cuando la registre, verás la línea de tiempo aquí.
        </p>
      ) : (
        <ol className="mt-6 space-y-4">
          {timeline.map((step, idx) => {
            const isLast = idx === timeline.length - 1;
            return (
              <li key={step.key} className="relative pl-10">
                {!isLast ? (
                  <span className="absolute left-[13px] top-7 h-[calc(100%+0.4rem)] w-[2px] bg-neon-green/45 shadow-[0_0_18px_rgba(57,255,20,0.65)]" />
                ) : null}
                <span
                  className={`absolute left-0 top-1 inline-flex size-7 items-center justify-center rounded-full border ${statusBadgeClass(step)}`}
                >
                  <BadgeCheck className="size-4" strokeWidth={2.2} />
                </span>
                <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-3">
                  <p className="text-sm font-semibold text-white">{step.label}</p>
                  <p className="mt-1 text-xs text-zinc-500">{step.detail ?? "Sin detalle aún"}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </PerfilSubLayout>
  );
}
