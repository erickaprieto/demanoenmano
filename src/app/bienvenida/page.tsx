import { BienvenidaEntryClient } from "@/components/onboarding/BienvenidaEntryClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Bienvenid@",
  description:
    "Onboarding De Mano en Mano: vendé, comprá con estilo y pagá seguro con el pago seguro de la plataforma.",
};

export default function BienvenidaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#1A1A1A] text-sm text-zinc-500">
          Cargando…
        </div>
      }
    >
      <BienvenidaEntryClient />
    </Suspense>
  );
}
