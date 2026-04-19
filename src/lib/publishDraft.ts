import type { PhotoMediaKind } from "@/data/photoSlotHints";
import type { FichaTecnicaV1 } from "@/data/vendorVerificationQuestionnaire";

const STORAGE_KEY = "vibe:publishDraft:v1";

export type PublishDraftAssetMeta = {
  slotId: string;
  kind: PhotoMediaKind;
  fileName: string;
  fileSize: number;
};

/**
 * Payload de publicación guardado en cliente (demo; sin subida real).
 * En producción, enviá `ficha_tecnica` a Supabase como JSONB en `productos.ficha_tecnica`.
 */
export type PublishDraftV1 = {
  version: 1;
  savedAt: string;
  sellCategory: string;
  sellCategoryLabel: string;
  sellOtherText?: string;
  title: string;
  description: string;
  condition: number;
  priceColones: number;
  weightTier: string;
  assetsMeta: PublishDraftAssetMeta[];
  /** Respuestas del cuestionario de verificación por categoría. */
  ficha_tecnica?: FichaTecnicaV1;
};

export function savePublishDraft(draft: PublishDraftV1): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Quota u otro error: no bloquear el flujo demo.
  }
}

export function readPublishDraft(): PublishDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublishDraftV1;
    if (parsed?.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Construye la URL de checkout con precio, título, peso y categoría del borrador. */
export function buildCheckoutHrefFromDraft(draft: PublishDraftV1): string {
  const params = new URLSearchParams();
  params.set("precio", String(draft.priceColones));
  params.set("titulo", draft.title);
  params.set("peso", draft.weightTier);
  params.set("categoria", draft.sellCategory);
  const spec = draft.sellOtherText?.trim();
  if (spec) params.set("especificacion", spec);
  return `/checkout?${params.toString()}`;
}
