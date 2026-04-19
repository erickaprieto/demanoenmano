import { PagoExitoClient } from "@/components/checkout/PagoExitoClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Pago exitoso",
  description: "Confirmación y referencias de tu pago seguro en De Mano en Mano.",
};

function Fallback() {
  return (
    <div className="px-4 pt-8">
      <div className="mx-auto max-w-md space-y-4">
        <div className="mx-auto size-16 animate-pulse rounded-2xl bg-zinc-800" />
        <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-zinc-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    </div>
  );
}

export default function PagoExitoPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <PagoExitoClient />
    </Suspense>
  );
}
