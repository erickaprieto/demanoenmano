const BLOCKED_TERMS = [
  "comida",
  "alimento",
  "alimentos",
  "snack",
  "snacks",
  "bebida",
  "bebidas",
  "animal",
  "animales",
  "mascota",
  "mascotas",
  "perro",
  "gato",
  "medicamento",
  "medicamentos",
  "medicina",
  "farmaco",
  "fármaco",
  "pastilla",
  "pastillas",
  "jarabe",
  "antibiotico",
  "antibiótico",
] as const;

/** En esta categoría se permiten palabras típicas de ropa/accesorios para mascotas. */
const PET_ACCESSORY_CATEGORY_IDS = new Set(["ropa_mascotas"]);

const TERMS_RELAXED_FOR_PET_ACCESSORY = new Set([
  "mascota",
  "mascotas",
  "perro",
  "gato",
]);

export function findBlockedListingTerm(
  text: string,
  sellCategoryId?: string,
): string | null {
  const terms: readonly string[] =
    sellCategoryId && PET_ACCESSORY_CATEGORY_IDS.has(sellCategoryId)
      ? BLOCKED_TERMS.filter((t) => !TERMS_RELAXED_FOR_PET_ACCESSORY.has(t))
      : BLOCKED_TERMS;

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  for (const term of terms) {
    const t = term
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (normalized.includes(t)) return term;
  }
  return null;
}
