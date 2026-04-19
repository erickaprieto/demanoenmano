import type { SwipeProduct } from "@/data/swipeProducts";

/** URL de checkout desde un producto del feed (incluye listingId para marcar vendido). */
export function buildCheckoutHrefFromSwipeProduct(product: SwipeProduct): string {
  const q = new URLSearchParams();
  q.set("listingId", product.id);
  q.set("precio", String(product.priceColones));
  q.set("titulo", product.name);
  if (product.categoryId) q.set("categoria", product.categoryId);
  q.set("peso", "1_2kg");
  return `/checkout?${q.toString()}`;
}
