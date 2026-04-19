import { SELL_CATEGORY_OPTIONS } from "@/data/sellCategories";
import {
  getQuestionsForCategory,
  type VendorQuestion,
} from "@/data/vendorVerificationQuestionnaire";

export type TaxonomyCategory = {
  id: string;
  label: string;
  sort_order: number;
};

export type MarketplaceTaxonomyPayload = {
  categories: TaxonomyCategory[];
  /** Preguntas de verificación por categoría (ficha técnica). */
  attributesByCategory: Record<string, VendorQuestion[]>;
};

/** Taxonomía embebida (fallback sin DB o antes del primer seed). */
export function buildStaticTaxonomy(): MarketplaceTaxonomyPayload {
  const categories: TaxonomyCategory[] = SELL_CATEGORY_OPTIONS.map((c, i) => ({
    id: c.id,
    label: c.label,
    sort_order: i,
  }));
  const attributesByCategory: Record<string, VendorQuestion[]> = {};
  for (const c of SELL_CATEGORY_OPTIONS) {
    attributesByCategory[c.id] = getQuestionsForCategory(c.id).map((q) => ({
      ...q,
      options: q.options ? [...q.options] : undefined,
    }));
  }
  return { categories, attributesByCategory };
}

export function buildCategorySheetOptions(
  categories: { id: string; label: string }[],
): { id: string | null; label: string }[] {
  return [
    { id: null, label: "Todas las categorías" },
    ...categories.map((c) => ({ id: c.id, label: c.label })),
  ];
}
