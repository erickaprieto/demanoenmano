"use client";

import { BrandName } from "@/components/branding/BrandName";
import { formatColones } from "@/lib/formatColones";
import {
  CORREOS_SHIPPING_CRC,
  shippingColonesForTier,
} from "@/lib/checkoutShipping";

const COMMISSION_RATE = 0.17;
const COMMISSION_FIXED = 500;
const EXAMPLE_BUYER_SHIPPING = 2_500;

type PublicationTransparencyCalculatorProps = {
  formId: string;
  /** Valor crudo del input de precio (solo dígitos). */
  priceColonesRaw: string;
  /** Valor del select de peso; vacío si aún no eligió. */
  weightTier: string;
  accepted: boolean;
  onAcceptedChange: (value: boolean) => void;
  error?: string;
};

function parsePriceColones(raw: string): number | null {
  const n = Number(String(raw).replace(/\D/g, ""));
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

export function PublicationTransparencyCalculator({
  formId,
  priceColonesRaw,
  weightTier,
  accepted,
  onAcceptedChange,
  error,
}: PublicationTransparencyCalculatorProps) {
  const price = parsePriceColones(priceColonesRaw);
  const commission =
    price != null
      ? Math.round(price * COMMISSION_RATE) + COMMISSION_FIXED
      : null;
  const netGain = price != null && commission != null ? price - commission : null;

  const buyerShippingFromTier =
    weightTier && weightTier in CORREOS_SHIPPING_CRC
      ? shippingColonesForTier(weightTier)
      : null;
  const buyerShippingDisplay =
    buyerShippingFromTier != null
      ? `₡${formatColones(buyerShippingFromTier)}`
      : `₡${formatColones(EXAMPLE_BUYER_SHIPPING)}`;

  const checkboxId = `${formId}-payout-shipping-terms`;

  return (
    <section
      className="mt-4 space-y-4 rounded-2xl border border-white/[0.08] bg-obsidian-elevated/50 p-4 ring-1 ring-white/[0.04]"
      aria-labelledby={`${formId}-transparency-title`}
    >
      <h3
        id={`${formId}-transparency-title`}
        className="text-sm font-semibold text-white"
      >
        Calculadora de transparencia
      </h3>

      <dl className="space-y-2.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-zinc-500">Precio de venta</dt>
          <dd className="font-mono tabular-nums text-zinc-200">
            {price != null ? `₡${formatColones(price)}` : "—"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-zinc-500">
            Comisión <BrandName />{" "}
            <span className="text-[10px] font-normal text-zinc-600">
              (17% + ₡500)
            </span>
          </dt>
          <dd className="font-mono tabular-nums text-zinc-300">
            {commission != null ? `₡${formatColones(commission)}` : "—"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-white/[0.06] pt-2.5">
          <dt className="text-xs font-medium text-zinc-400">
            Envío estimado (comprador)
          </dt>
          <dd className="text-right">
            <span className="font-mono text-sm font-semibold tabular-nums text-zinc-100">
              {buyerShippingDisplay}
            </span>
            <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">
              Lo paga el comprador;{" "}
              {!weightTier
                ? "ejemplo hasta que elijas peso arriba."
                : "según el rango de peso indicado."}
            </p>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-white/[0.06] pt-2.5">
          <dt className="text-sm font-semibold text-zinc-200">Ganancia neta</dt>
          <dd
            className={`font-mono text-lg font-bold tabular-nums text-neon-green ${
              netGain != null
                ? "drop-shadow-[0_0_10px_rgba(51,255,0,0.45)] drop-shadow-[0_0_20px_rgba(51,255,0,0.2)]"
                : ""
            }`}
          >
            {netGain != null ? `₡${formatColones(netGain)}` : "—"}
          </dd>
        </div>
      </dl>

      <div className="rounded-xl border border-violet-electric/35 bg-violet-electric/[0.08] px-3.5 py-3 ring-1 ring-violet-electric/20">
        <p className="flex items-center gap-2 text-xs font-semibold text-violet-100">
          <span className="text-base leading-none" aria-hidden>
            🔒
          </span>
          <span>Dinero retenido por seguridad</span>
        </p>
        <ul className="mt-2.5 list-disc space-y-2 pl-4 text-[11px] leading-relaxed text-zinc-300 marker:text-violet-electric/80">
          <li>
            El dinero se retiene en custodia al momento de la compra.
          </li>
          <li>
            El pago al vendedor se libera cuando registrás el número de guía de
            Correos de Costa Rica{" "}
            <strong className="font-semibold text-zinc-100">
              dentro de <BrandName />
            </strong>
            .
          </li>
          <li>
            El comprador puede{" "}
            <strong className="font-semibold text-zinc-100">valorar</strong> la
            compra después de recibir el producto.
          </li>
        </ul>
      </div>

      <div>
        <label
          htmlFor={checkboxId}
          className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 text-left ring-1 ring-white/[0.04] transition hover:border-violet-electric/25"
        >
          <input
            id={checkboxId}
            type="checkbox"
            checked={accepted}
            onChange={(e) => onAcceptedChange(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-zinc-600 bg-obsidian text-violet-electric focus:ring-violet-electric/40"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${checkboxId}-err` : undefined}
          />
          <span className="text-[11px] leading-snug text-zinc-400">
            Entiendo que mi pago depende de subir la guía de envío en el plazo
            establecido.
          </span>
        </label>
        {error ? (
          <p id={`${checkboxId}-err`} className="mt-1.5 text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
