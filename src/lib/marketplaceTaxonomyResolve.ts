import { getSellCategoryLabelById } from "@/data/sellCategories";
import type { MarketplaceTaxonomyPayload } from "@/lib/marketplaceTaxonomyStatic";

export function resolveCategoryLabel(
  categoryId: string,
  taxonomy: MarketplaceTaxonomyPayload | null | undefined,
): string {
  const hit = taxonomy?.categories.find((c) => c.id === categoryId);
  if (hit) return hit.label;
  return getSellCategoryLabelById(categoryId);
}
