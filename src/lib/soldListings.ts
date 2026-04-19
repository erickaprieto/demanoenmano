/**
 * Listados vendidos (demo en localStorage): dejan de mostrarse en el swipe
 * pero siguen asociados al vendedor para historial / ventas.
 */
import { SWIPE_PRODUCTS } from "@/data/swipeProducts";

const STORAGE_KEY = "vibe:soldListings:v1";

export type SoldListingRecord = {
  listingId: string;
  sellerUserId: string;
  soldAt: string;
  title?: string;
};

export function getSoldListings(): SoldListingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SoldListingRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getSoldListingIdSet(): Set<string> {
  return new Set(getSoldListings().map((r) => r.listingId));
}

export function markListingSold(record: Omit<SoldListingRecord, "soldAt">): void {
  if (typeof window === "undefined") return;
  const existing = getSoldListings();
  if (existing.some((r) => r.listingId === record.listingId)) return;
  const next: SoldListingRecord[] = [
    ...existing,
    { ...record, soldAt: new Date().toISOString() },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("vibe-sold-listings-updated"));
}

/** Tras checkout: marca vendido si el id corresponde al catálogo swipe. */
export function markListingSoldFromCheckout(input: {
  listingId?: string | null;
  title?: string;
}): void {
  const id = input.listingId?.trim();
  if (!id) return;
  const product = SWIPE_PRODUCTS.find((p) => p.id === id);
  if (!product) return;
  markListingSold({
    listingId: product.id,
    sellerUserId: product.sellerUserId ?? `seller_${product.id}`,
    title: input.title?.trim() || product.name,
  });
}
