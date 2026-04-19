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

export function findBlockedListingTerm(text: string): string | null {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  for (const term of BLOCKED_TERMS) {
    const t = term
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (normalized.includes(t)) return term;
  }
  return null;
}
