"use client";

import { useSearchParams } from "next/navigation";
import { DeliveryProfileForm } from "./DeliveryProfileForm";
import { PerfilSubLayout } from "./PerfilSubLayout";

export function DatosEnvioPageClient() {
  const search = useSearchParams();
  const returnToCheckout = search.get("return") === "checkout";

  return (
    <PerfilSubLayout title="Datos de envío">
      <DeliveryProfileForm returnToCheckout={returnToCheckout} />
    </PerfilSubLayout>
  );
}
