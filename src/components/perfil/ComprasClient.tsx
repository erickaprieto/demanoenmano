"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatColones } from "@/lib/formatColones";
import { hasDeliveryProfile } from "@/lib/deliveryProfile";
import { getDemoOrders, type DemoOrder } from "@/lib/ordersDemo";
import { hasBuyerShippingComplete, loadVibeDualProfile } from "@/lib/vibeProfile";
import { PerfilSubLayout } from "./PerfilSubLayout";

function statusLabel(s: DemoOrder["status"]) {
  if (s === "pendiente_envio") return "Vendedor prepara envío";
  if (s === "en_camino") return "En camino (Correos)";
  if (s === "reembolso_automatico") return "Reembolso / cancelado";
  return "Entregado";
}

function shippingReady(): boolean {
  return (
    hasDeliveryProfile() && hasBuyerShippingComplete(loadVibeDualProfile())
  );
}

type ComprasClientProps = {
  embedded?: boolean;
};

export function ComprasClient({ embedded = false }: ComprasClientProps) {
  const [orders, setOrders] = useState<DemoOrder[]>(() =>
    typeof window === "undefined"
      ? []
      : getDemoOrders().filter((o) => o.side === "compra"),
  );
  const [profileOk, setProfileOk] = useState(() =>
    typeof window === "undefined" ? false : shippingReady(),
  );

  useEffect(() => {
    const on = () => {
      setOrders(getDemoOrders().filter((o) => o.side === "compra"));
      setProfileOk(shippingReady());
    };
    window.addEventListener("vibe-demo-orders-updated", on);
    window.addEventListener("vibe-delivery-profile-updated", on);
    window.addEventListener("vibe-dual-profile-updated", on);
    return () => {
      window.removeEventListener("vibe-demo-orders-updated", on);
      window.removeEventListener("vibe-delivery-profile-updated", on);
      window.removeEventListener("vibe-dual-profile-updated", on);
    };
  }, []);

  const list = (
    <>
      {!profileOk ? (
        <div className="mb-6 rounded-2xl border border-violet-electric/30 bg-violet-electric/10 p-4 text-sm text-violet-100">
          <p className="font-semibold text-white">
            Completá tu dirección de entrega (Correos CR)
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-300">
            En el primer checkout necesitamos provincia, cantón y dirección para
            Correos. No pedimos cédula ni IBAN aquí. Los datos quedan en tu cuenta
            como comprador.
          </p>
          <Link
            href="/perfil/datos-envio"
            className="mt-3 inline-flex rounded-xl bg-violet-electric px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Ir a datos de envío
          </Link>
        </div>
      ) : null}

      {!embedded ? (
        <p className="mb-6 text-sm leading-relaxed text-zinc-500">
          Tu pago queda retenido en De Mano en Mano hasta que el vendedor cargue la guía de
          Correos en la app; ahí se libera al vendedor. Seguí el envío con esa guía.
          Cuando recibas el paquete, podés valorar la compra en reseñas. Los datos de
          contacto no se comparten entre partes: solo estados y rastreo oficial de
          Correos.
        </p>
      ) : null}
      <ul className="space-y-4">
        {orders.map((o) => (
          <li
            key={o.id}
            className="rounded-2xl border border-white/[0.06] bg-obsidian-elevated/80 p-4 ring-1 ring-white/[0.04]"
          >
            <p className="font-medium text-white">{o.title}</p>
            <p className="mt-1 text-xs text-zinc-500">{o.counterpartyHint}</p>
            <p className="mt-2 font-mono text-sm text-neon-green">
              ₡{formatColones(o.amountColones)}
            </p>
            <p className="mt-2 text-[11px] text-zinc-600">{statusLabel(o.status)}</p>
            {o.trackingNumber ? (
              <div className="mt-3 rounded-xl border border-white/[0.08] bg-obsidian px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Guía Correos
                </p>
                <p className="mt-1 font-mono text-sm text-white">{o.trackingNumber}</p>
                <a
                  href={`https://correos.go.cr/rastreo?q=${encodeURIComponent(o.trackingNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-violet-300 hover:underline"
                >
                  Rastrear en Correos (enlace demo)
                </a>
                <Link
                  href={`/perfil/compras/rastreo/${encodeURIComponent(o.id)}`}
                  className="mt-2 inline-block text-xs font-semibold text-neon-green hover:underline"
                >
                  Ver rastreo integrado
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">
                El vendedor aún no registró la guía. Te avisaremos en la app cuando
                esté disponible.
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );

  if (embedded) {
    return <div className="pb-2">{list}</div>;
  }

  return <PerfilSubLayout title="Mis compras">{list}</PerfilSubLayout>;
}
