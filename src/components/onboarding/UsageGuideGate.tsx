"use client";

import { isUsageGuideDismissed } from "@/lib/usageGuideDismissed";
import { useLayoutEffect, useState } from "react";
import { UsageGuideOverlay } from "./UsageGuideOverlay";

/**
 * Muestra una sola vez (localStorage) la guía de uso al entrar al layout de tabs,
 * típicamente después de aceptar términos y llegar al inicio de la app.
 */
export function UsageGuideGate() {
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    setOpen(!isUsageGuideDismissed());
  }, []);

  if (!open) return null;

  return <UsageGuideOverlay onClose={() => setOpen(false)} />;
}
