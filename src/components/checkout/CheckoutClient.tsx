"use client";

import { hasDeliveryProfile, loadDeliveryProfile } from "@/lib/deliveryProfile";
import { formatColones } from "@/lib/formatColones";
import {
  shippingColonesForTier,
  weightTierDisplay,
} from "@/lib/checkoutShipping";
import {
  getSellCategoryLabelById,
  SELL_CATEGORY_OTRO_ID,
} from "@/data/sellCategories";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { getPaymentsPublicMode } from "@/lib/payments/strategy";
import { confirmCheckoutPaymentDemo } from "@/lib/ordersDemo";
import {
  hasBuyerShippingComplete,
  loadVibeDualProfile,
  syncShippingFromDeliveryProfile,
} from "@/lib/vibeProfile";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const card =
  "rounded-2xl border border-white/[0.06] bg-obsidian-elevated/90 p-4 ring-1 ring-white/[0.04]";
const CUANTO_CARD_FEE_RATE = 0.049;
const CUANTO_CARD_FEE_FIXED_COLONES = 225;

function parsePrecio(raw: string | null): number {
  if (!raw) return 48_000;
  const n = Number(String(raw).replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 48_000;
}

export function CheckoutClient() {
  const search = useSearchParams();
  const garmentPrice = useMemo(
    () => parsePrecio(search.get("precio")),
    [search],
  );
  const title = useMemo(() => {
    const t = search.get("titulo");
    if (!t) return "Prenda seleccionada";
    try {
      return decodeURIComponent(t);
    } catch {
      return t;
    }
  }, [search]);
  const weightTier = search.get("peso");
  const categoryId = search.get("categoria");
  const especificacionRaw = search.get("especificacion");
  const listingId = useMemo(
    () => search.get("listingId")?.trim() || null,
    [search],
  );

  const categoryLine = useMemo(() => {
    if (!categoryId) return null;
    const base = getSellCategoryLabelById(categoryId);
    if (categoryId === SELL_CATEGORY_OTRO_ID && especificacionRaw) {
      return `${base} — ${especificacionRaw}`;
    }
    return base;
  }, [categoryId, especificacionRaw]);

  const weightLabel = useMemo(
    () => weightTierDisplay(weightTier),
    [weightTier],
  );

  const shipping = useMemo(
    () => shippingColonesForTier(weightTier),
    [weightTier],
  );
  const transactionFee = useMemo(
    () =>
      Math.round(
        garmentPrice * CUANTO_CARD_FEE_RATE + CUANTO_CARD_FEE_FIXED_COLONES,
      ),
    [garmentPrice],
  );
  const total = garmentPrice + shipping + transactionFee;

  const [phase, setPhase] = useState<"review" | "paying" | "done">("review");
  const [checkoutReady, setCheckoutReady] = useState(() =>
    typeof window === "undefined"
      ? false
      : hasDeliveryProfile() &&
          hasBuyerShippingComplete(loadVibeDualProfile()),
  );
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const d = loadDeliveryProfile();
      if (d) syncShippingFromDeliveryProfile(d);
      setCheckoutReady(
        hasDeliveryProfile() &&
          hasBuyerShippingComplete(loadVibeDualProfile()),
      );
    };
    sync();
    window.addEventListener("vibe-delivery-profile-updated", sync);
    window.addEventListener("vibe-dual-profile-updated", sync);
    return () => {
      window.removeEventListener("vibe-delivery-profile-updated", sync);
      window.removeEventListener("vibe-dual-profile-updated", sync);
    };
  }, []);

  const pay = async () => {
    if (phase !== "review" || !checkoutReady) return;
    setPaymentError(null);
    setPhase("paying");
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `VB-${Date.now()}`;
    setOrderId(id);

    if (getPaymentsPublicMode() === "live") {
      try {
        const res = await fetch("/api/payments/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: id,
            amountColones: total,
            description: title,
            listingId,
            weightTier,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          redirectUrl?: string;
          provider?: string;
        };
        if (!res.ok) {
          setPhase("review");
          setPaymentError(
            typeof data.error === "string"
              ? data.error
              : "No se pudo iniciar el cobro con el proveedor de pagos.",
          );
          return;
        }
        if (typeof data.redirectUrl === "string" && data.redirectUrl.length > 0) {
          const target = getSafePaymentRedirectUrl(data.redirectUrl);
          if (!target) {
            setPhase("review");
            setPaymentError("El proveedor devolvió una URL no permitida.");
            return;
          }
          window.location.assign(target);
          return;
        }
        setPhase("review");
        setPaymentError(
          `El servidor de ${data.provider ?? "pagos"} respondió sin URL de redirección (revisá la integración).`,
        );
        return;
      } catch {
        setPhase("review");
        setPaymentError(
          "Error de red al contactar el servicio de pagos. Intentá de nuevo.",
        );
        return;
      }
    }

    await new Promise((r) => setTimeout(r, 700));
    setPhase("done");
    confirmCheckoutPaymentDemo({
      title,
      amountColones: garmentPrice,
      listingId,
    });
  };

  return (
    <div className="px-4 pb-8 pt-5">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Volver
      </Link>

      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-electric">
          Checkout
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Confirmación de compra
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Revisá el desglose y leé cómo funciona el pago del comprador abajo.
        </p>
      </header>

      <div className={`${card} mb-4`}>
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Artículo
        </p>
        <p className="mt-1 text-base font-semibold leading-snug text-white">
          {title}
        </p>
        {categoryLine ? (
          <p className="mt-2 text-xs text-zinc-500">
            Categoría:{" "}
            <span className="text-zinc-200">{categoryLine}</span>
          </p>
        ) : null}
        <p className="mt-2 text-xs text-zinc-500">
          Peso para envío:{" "}
          <span className="text-zinc-200">{weightLabel}</span>
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-600">
          Precio base del artículo. El envío estimado (según el peso que indicaste
          al publicar) y la Comisión de Transacción Segura se muestran abajo y{" "}
          <span className="text-zinc-400">se suman al total a pagar</span>.
        </p>
      </div>

      <div className={`${card} mb-4`}>
        <h2 className="text-sm font-semibold text-white">Desglose</h2>
        <ul className="mt-4 divide-y divide-white/[0.06] text-sm">
          <li className="flex items-start justify-between gap-4 py-3 first:pt-0">
            <span className="text-zinc-400">Precio de la prenda</span>
            <span className="shrink-0 font-mono tabular-nums text-zinc-100">
              ₡{formatColones(garmentPrice)}
            </span>
          </li>
          <li className="flex items-start justify-between gap-4 py-3">
            <span className="text-zinc-400">
              Tarifa de envío
              <span className="mt-0.5 block text-[11px] text-zinc-600">
                Correos de Costa Rica · según {weightLabel}
              </span>
            </span>
            <span className="shrink-0 font-mono tabular-nums text-zinc-100">
              ₡{formatColones(shipping)}
            </span>
          </li>
          <li className="flex items-start justify-between gap-4 py-3">
            <span className="text-zinc-400">Comisión de Transacción Segura</span>
            <span className="shrink-0 font-mono tabular-nums text-neon-green">
              ₡{formatColones(transactionFee)}
            </span>
          </li>
          <li className="flex items-center justify-between gap-4 pt-4">
            <span className="text-sm font-semibold text-white">Total</span>
            <span className="font-mono text-lg font-semibold tabular-nums text-white">
              ₡{formatColones(total)}
            </span>
          </li>
        </ul>
      </div>

      <div className={`${card} mb-6`}>
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-electric/15 text-violet-electric ring-1 ring-violet-electric/25">
            <Shield className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-2 text-sm leading-relaxed text-zinc-400">
            <p className="font-medium text-zinc-200">Retención segura en De Mano en Mano</p>
            <p>
              El dinero de esta compra queda{" "}
              <span className="text-zinc-200">retenido por De Mano en Mano</span> mientras el
              vendedor prepara el envío.
            </p>
            <p>
              Cuando el vendedor registre la guía de Correos dentro de la app,
              liberamos el pago al vendedor. Después de que recibas el paquete
              podés valorar la compra. Así reducimos estafas y mantenemos un canal
              de soporte si algo no cuadra.
            </p>
          </div>
        </div>
      </div>

      <div className={`${card} mb-6`}>
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neon-green/10 text-neon-green ring-1 ring-neon-green/25">
            <CreditCard className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-3 text-sm leading-relaxed text-zinc-400">
            <p className="font-medium text-white">Cómo pagás vos (comprador)</p>
            <ol className="list-decimal space-y-2.5 pl-4 text-xs marker:text-violet-electric/80">
              <li>
                <span className="text-zinc-300">En producción</span>, al tocar{" "}
                <span className="text-zinc-200">«Pagar»</span>, se abre la pantalla
                del{" "}
                <strong className="font-medium text-zinc-200">
                  procesador de pagos
                </strong>{" "}
                que contrate la plataforma De Mano en Mano (pasarela certificada). Ahí elegís el medio:
                por ejemplo{" "}
                <strong className="font-medium text-zinc-200">
                  tarjeta de débito o crédito
                </strong>
                , y si está habilitado en la integración,{" "}
                <strong className="font-medium text-zinc-200">
                  SINPE Móvil u otros métodos
                </strong>{" "}
                que el proveedor permita.{" "}
                <span className="text-zinc-500">
                  Todo sigue dentro de la app; no te pedimos hacer una transferencia
                  manual a una cuenta del vendedor.
                </span>
              </li>
              <li>
                Autorizás el cobro por el{" "}
                <span className="text-zinc-200">total en colones (₡)</span> que ves
                en el desglose (prenda + envío estimado + comisión). El dinero{" "}
                <strong className="font-medium text-zinc-200">
                  no va directo al IBAN del vendedor
                </strong>
                : queda en custodia en De Mano en Mano hasta que el vendedor cargue la guía
                de Correos en la app; ahí se libera al vendedor.
              </li>
              <li>
                <span className="text-zinc-300">En esta demo</span> no hay banco ni
                tarjeta: el botón morado{" "}
                <span className="text-zinc-200">simula</span> que ya pasaste por la
                pasarela y el pago quedó registrado.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {phase === "review" && !checkoutReady ? (
        <div className={`${card} mb-6 border-violet-electric/25`}>
          <p className="text-sm font-semibold text-white">
            Completá tu dirección de entrega (Correos CR)
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            En tu primer pago necesitamos provincia, cantón y dirección para
            Correos (perfil comprador). No pedimos cédula ni IBAN en el checkout.
            Podés cargar la ficha ahora y volver acá.
          </p>
          <Link
            href="/perfil/datos-envio?return=checkout"
            className="mt-4 flex w-full items-center justify-center rounded-2xl bg-violet-electric py-3 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(138,43,226,0.5)] transition hover:brightness-110"
          >
            Ir a datos de envío
          </Link>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className={`${card} mb-6 space-y-5`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <CheckCircle2 className="size-5 text-neon-green" strokeWidth={2} />
            Pago exitoso
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-obsidian p-4 ring-1 ring-white/[0.04]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neon-green">
              Cómo hubieras pagado (recordatorio)
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              En la app real, después de «Pagar» hubieras visto el checkout del
              proveedor de pagos: ingresar tarjeta o elegir SINPE (si aplica), todo
              en colones. Acá solo simulamos ese paso;{" "}
              <span className="text-zinc-200">no se cobró nada a tu tarjeta</span>.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-obsidian p-4 ring-1 ring-white/[0.04]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-electric">
              A dónde va el dinero que pagaste
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-zinc-400 marker:text-violet-electric/70">
              <li>
                El monto queda en{" "}
                <strong className="font-medium text-zinc-200">custodia en De Mano en Mano</strong>
                : no se transfiere de inmediato a una cuenta personal del
                vendedor.
              </li>
              <li>
                Cuando el vendedor registre la guía de{" "}
                <strong className="font-medium text-zinc-200">
                  Correos de Costa Rica
                </strong>{" "}
                dentro de De Mano en Mano, se libera el pago al vendedor.
              </li>
              <li>
                El artículo deja de mostrarse como disponible, pero sigue asociado
                al vendedor en el sistema (historial y ventas).
              </li>
              <li>
                El depósito se hace en{" "}
                <strong className="font-medium text-zinc-200">
                  colones costarricenses (CRC)
                </strong>{" "}
                a la cuenta{" "}
                <strong className="font-medium text-zinc-200">IBAN</strong> que
                el vendedor asoció al verificar su perfil (cuenta donde recibe
                liquidaciones de ventas).
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-violet-electric/25 bg-violet-electric/[0.06] p-4 ring-1 ring-violet-electric/15">
            <p className="text-xs font-semibold text-violet-100">
              IBAN del vendedor (cuenta en colones)
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
              Vos como comprador{" "}
              <span className="text-zinc-200">no cargás IBAN</span> en el checkout:
              solo pagás el total. El IBAN en colones es del vendedor; De Mano en Mano lo
              validó cuando publicó el producto. Ahí se acredita el saldo neto cuando se registre
              la guía (según términos y plazos).
            </p>
          </div>

          {orderId ? (
            <p className="text-center text-[10px] text-zinc-600">
              Referencia de pedido De Mano en Mano:{" "}
              <span className="font-mono text-zinc-500">{orderId}</span>
            </p>
          ) : null}
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-2xl border border-white/10 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04]"
          >
            Volver al inicio
          </Link>
        </div>
      ) : null}

      {paymentError && phase === "review" ? (
        <p
          className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-center text-xs leading-relaxed text-red-200"
          role="alert"
        >
          {paymentError}
        </p>
      ) : null}

      {phase !== "done" ? (
        <button
          type="button"
          onClick={() => void pay()}
          disabled={phase === "paying" || !checkoutReady}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-electric py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_-4px_rgba(138,43,226,0.55)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {phase === "paying" ? (
            <>
              <Loader2 className="size-5 animate-spin" strokeWidth={2} />
              {getPaymentsPublicMode() === "live"
                ? "Redirigiendo a Cuanto…"
                : "Procesando pago…"}
            </>
          ) : (
            `Pagar ₡${formatColones(total)}`
          )}
        </button>
      ) : null}

      <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-600">
        Pagos: modo{" "}
        <span className="font-mono text-zinc-500">
          {getPaymentsPublicMode()}
        </span>
        . En <span className="text-zinc-500">demo</span> el botón simula el pago. En{" "}
        <span className="text-zinc-500">live</span>, el backend crea un checkout de{" "}
        <span className="font-mono text-zinc-500">Cuanto</span> y te redirige con{" "}
        <span className="font-mono text-zinc-500">/api/payments/create-session</span>.{" "}
        Configuración: <span className="font-mono text-zinc-500">.env.example</span>{" "}
        y <span className="font-mono text-zinc-500">src/lib/payments/strategy.ts</span>.
      </p>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-zinc-600">
        Demo URL:{" "}
        <span className="font-mono text-zinc-500">
          ?precio=35000&amp;titulo=Sudadera&amp;peso=1_2kg&amp;categoria=moda
        </span>
        . Desde Vender, al publicar, el enlace incluye peso y categoría.
      </p>
    </div>
  );
}

function getSafePaymentRedirectUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    const allowed = (
      process.env.NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS ??
      "web.cuanto.app,checkout.cuanto.app"
    )
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    return allowed.includes(parsed.hostname.toLowerCase()) ? parsed.toString() : null;
  } catch {
    return null;
  }
}
