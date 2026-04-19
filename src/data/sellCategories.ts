/** Identificador interno para la opción “Otro”. */
export const SELL_CATEGORY_OTRO_ID = "otro";

const RAW: { id: string; label: string }[] = [
  { id: "bebes_ninos", label: "Bebés y Niños" },
  { id: "belleza", label: "Belleza y Cuidado Personal" },
  { id: "calzado", label: "Calzado" },
  { id: "consolas", label: "Consolas y Videojuegos" },
  { id: "deportes", label: "Deportes y Fitness" },
  { id: "electronica", label: "Electrónica" },
  { id: "herramientas", label: "Herramientas y Construcción" },
  { id: "hobbies", label: "Hobbies y Coleccionables" },
  { id: "hogar", label: "Hogar y Decoración" },
  { id: "juguetes", label: "Juguetes" },
  { id: "moda", label: "Moda y Accesorios" },
  { id: "ropa_mascotas", label: "Ropa y Accesorios para mascotas" },
  {
    id: SELL_CATEGORY_OTRO_ID,
    label: "Otro (Para artículos misceláneos)",
  },
];

const otroEntry = RAW.find((x) => x.id === SELL_CATEGORY_OTRO_ID);
if (!otroEntry) {
  throw new Error("sellCategories: falta la opción Otro");
}
const otro = otroEntry;
const rest = RAW.filter((x) => x.id !== SELL_CATEGORY_OTRO_ID).sort((a, b) =>
  a.label.localeCompare(b.label, "es", { sensitivity: "base" }),
);

/** Orden alfabético por etiqueta; “Otro” siempre al final. */
export const SELL_CATEGORY_OPTIONS: readonly { id: string; label: string }[] = [
  ...rest,
  otro,
];

/** Etiqueta legible para UI y persistencia (demo). */
export function getSellCategoryLabelById(id: string): string {
  const found = SELL_CATEGORY_OPTIONS.find((o) => o.id === id);
  return found?.label ?? "Categoría";
}
