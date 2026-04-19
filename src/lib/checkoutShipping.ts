/** Rangos de peso alineados al formulario de publicación (demo). */

export type CheckoutWeightTier =
  | "lt_500g"
  | "lt_1kg"
  | "1_2kg"
  | "2_5kg"
  | "gt_5kg";

/** Tarifas simuladas en CRC (no oficiales). */
export const CORREOS_SHIPPING_CRC: Record<CheckoutWeightTier, number> = {
  lt_500g: 1_850,
  lt_1kg: 3_200,
  "1_2kg": 4_800,
  "2_5kg": 6_900,
  gt_5kg: 9_800,
};

export const WEIGHT_TIER_LABELS: Record<CheckoutWeightTier, string> = {
  lt_500g: "Menos de 500 g",
  lt_1kg: "Menos de 1 kg",
  "1_2kg": "1 – 2 kg",
  "2_5kg": "2 – 5 kg",
  gt_5kg: "Más de 5 kg",
};

export function shippingColonesForTier(tier: string | null): number {
  if (tier && tier in CORREOS_SHIPPING_CRC) {
    return CORREOS_SHIPPING_CRC[tier as CheckoutWeightTier];
  }
  return 3_200;
}

export function weightTierDisplay(tier: string | null): string {
  if (tier && tier in WEIGHT_TIER_LABELS) {
    return WEIGHT_TIER_LABELS[tier as CheckoutWeightTier];
  }
  return "Rango de peso no indicado";
}
