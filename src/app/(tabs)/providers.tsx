"use client";

import { ModerationAccountGate } from "@/components/moderation/ModerationAccountGate";
import { ChatProvider } from "@/context/ChatContext";
import {
  getLegalProfile,
  syncModerationCookiesFromProfile,
} from "@/lib/legalProfile";
import { processOverdueSellerShipments } from "@/lib/shippingDeadlineEnforcement";
import { useEffect } from "react";

export function TabsProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    processOverdueSellerShipments();
    const id = setInterval(
      () => processOverdueSellerShipments(),
      120_000,
    );
    void syncModerationCookiesFromProfile(getLegalProfile());
    return () => clearInterval(id);
  }, []);

  return (
    <ChatProvider>
      <ModerationAccountGate />
      {children}
    </ChatProvider>
  );
}
