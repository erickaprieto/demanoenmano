import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Confirmar compra",
  description:
    "Desglose de compra, Comisión de Transacción Segura y referencia de envío Correos (demo).",
};

function CheckoutFallback() {
  return (
    <div className="px-4 pt-6">
      <div className="mb-5 h-4 w-20 animate-pulse rounded bg-zinc-800" />
      <div className="mb-2 h-9 max-w-[14rem] animate-pulse rounded-lg bg-zinc-800" />
      <div className="mb-6 h-4 max-w-xs animate-pulse rounded bg-zinc-800/80" />
      <div className="mb-4 h-28 animate-pulse rounded-2xl bg-zinc-900" />
      <div className="h-56 animate-pulse rounded-2xl bg-zinc-900" />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutClient />
    </Suspense>
  );
}
