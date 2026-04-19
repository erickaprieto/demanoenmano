import { DatosEnvioPageClient } from "@/components/perfil/DatosEnvioPageClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Datos de envío",
};

function DatosEnvioFallback() {
  return (
    <div className="px-4 pb-8 pt-6">
      <div className="mb-4 h-4 w-24 animate-pulse rounded bg-zinc-800" />
      <div className="mb-2 h-8 max-w-[12rem] animate-pulse rounded-lg bg-zinc-800" />
      <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-900" />
    </div>
  );
}

export default function DatosEnvioPage() {
  return (
    <Suspense fallback={<DatosEnvioFallback />}>
      <DatosEnvioPageClient />
    </Suspense>
  );
}
