"use client";

import { BrandName, textWithBrandItalic } from "@/components/branding/BrandName";
import { CheckCircle2, Fingerprint, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const card =
  "rounded-2xl border border-white/[0.06] bg-[#242424]/90 p-4 ring-1 ring-white/[0.04]";

export function PagoExitoClient() {
  const sp = useSearchParams();
  const orderId = sp.get("orderId");
  const source = sp.get("source") ?? "cuanto";
  const transactionRef =
    sp.get("transaction_id") ?? sp.get("payment_ref");

  return (
    <div className="px-4 pb-10 pt-6">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#39FF14]/15 text-[#39FF14] ring-1 ring-[#39FF14]/35">
            <CheckCircle2 className="size-9" strokeWidth={1.75} />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            Pago confirmado
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Tu transacción quedó registrada de forma segura. Podés usar estos
            datos como referencia en soporte o en tu historial.
          </p>
        </div>

        <div className={card}>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#39FF14]">
            <Fingerprint className="size-4" strokeWidth={2} />
            Seguimiento multi-rastreo
          </p>
          <ul className="mt-4 space-y-3 text-xs text-zinc-400">
            <li className="flex justify-between gap-3 border-b border-white/[0.06] pb-3">
              <span className="text-zinc-500">Canal</span>
              <span className="font-mono text-zinc-200">{source}</span>
            </li>
            {orderId ? (
              <li className="flex justify-between gap-3 border-b border-white/[0.06] pb-3">
                <span className="text-zinc-500">
                  Pedido <BrandName />
                </span>
                <span className="max-w-[55%] truncate font-mono text-zinc-200">
                  {orderId}
                </span>
              </li>
            ) : null}
            {transactionRef && transactionRef !== orderId ? (
              <li className="flex justify-between gap-3 pt-1">
                <span className="text-zinc-500">Referencia de pago</span>
                <span className="max-w-[55%] truncate font-mono text-zinc-200">
                  {transactionRef}
                </span>
              </li>
            ) : (
              <li className="flex items-start gap-2 pt-1 text-zinc-500">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-violet-electric" />
                {textWithBrandItalic(
                  "Si Cuanto o el banco añaden parámetros en la URL al volver, los podés ignorar: el pedido queda registrado en De Mano en Mano.",
                )}
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#8A2BE2]/30 bg-[#8A2BE2]/[0.07] p-4 ring-1 ring-[#8A2BE2]/15">
          <p className="flex items-center gap-2 text-xs font-semibold text-violet-100">
            <Lock className="size-4 text-[#39FF14]" strokeWidth={2} />
            {textWithBrandItalic("Pago seguro De Mano en Mano")}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
            {textWithBrandItalic(
              "El cobro se procesó dentro de la app; no hubo redirección a un checkout externo genérico. La custodia y liberación de fondos siguen las reglas de De Mano en Mano.",
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/perfil/compras"
            className="flex w-full items-center justify-center rounded-2xl bg-[#39FF14] py-3.5 text-sm font-semibold text-[#0d0d0d] shadow-[0_0_28px_-4px_rgba(57,255,20,0.55)] transition hover:brightness-110"
          >
            Ver mis compras
          </Link>
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-2xl border border-white/10 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
