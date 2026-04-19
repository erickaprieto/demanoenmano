"use client";

import { WelcomeTermsClient } from "@/components/legal/WelcomeTermsClient";
import { WelcomeOpportunityScreen } from "@/components/onboarding/WelcomeOpportunityScreen";
import { useSearchParams } from "next/navigation";

/**
 * Suspensiones: mismo flujo legal que antes. Resto: onboarding de oportunidad.
 */
export function BienvenidaEntryClient() {
  const sp = useSearchParams();
  const suspension = sp.get("suspension");
  if (suspension === "perm" || suspension === "temp") {
    return <WelcomeTermsClient />;
  }
  return <WelcomeOpportunityScreen />;
}
