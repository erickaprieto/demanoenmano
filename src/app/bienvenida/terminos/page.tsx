import { WelcomeTermsClient } from "@/components/legal/WelcomeTermsClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Términos y registro",
  description:
    "Aceptación de términos y condiciones de De Mano en Mano Costa Rica antes de usar la app.",
};

function TermsFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#1A1A1A] text-sm text-zinc-500">
      Cargando…
    </div>
  );
}

export default function BienvenidaTerminosPage() {
  return (
    <Suspense fallback={<TermsFallback />}>
      <WelcomeTermsClient />
    </Suspense>
  );
}
