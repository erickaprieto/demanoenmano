export type ListingCondition = "nuevo" | "como_nuevo" | "usado";

export type DemoListing = {
  id: string;
  title: string;
  categoryId: string;
  priceColones: number;
  condition: ListingCondition;
};

/** Catálogo demo para filtros y búsqueda en cliente. */
export const DEMO_LISTINGS: DemoListing[] = [
  {
    id: "l1",
    title: "Chaqueta denim vintage",
    categoryId: "moda",
    priceColones: 48_000,
    condition: "usado",
  },
  {
    id: "l2",
    title: "Zapatillas running Nike",
    categoryId: "calzado",
    priceColones: 65_000,
    condition: "como_nuevo",
  },
  {
    id: "l3",
    title: "Nintendo Switch OLED",
    categoryId: "consolas",
    priceColones: 285_000,
    condition: "nuevo",
  },
  {
    id: "l4",
    title: "Aro de luz LED 18 pulgadas",
    categoryId: "electronica",
    priceColones: 18_500,
    condition: "usado",
  },
  {
    id: "l5",
    title: "Mesa de centro nogal",
    categoryId: "hogar",
    priceColones: 42_000,
    condition: "usado",
  },
  {
    id: "l6",
    title: "Bicicleta MTB 29",
    categoryId: "deportes",
    priceColones: 195_000,
    condition: "como_nuevo",
  },
  {
    id: "l7",
    title: "Set maquillaje profesional",
    categoryId: "belleza",
    priceColones: 32_000,
    condition: "nuevo",
  },
  {
    id: "l8",
    title: "Taladro inalámbrico DeWalt",
    categoryId: "herramientas",
    priceColones: 88_000,
    condition: "usado",
  },
  {
    id: "l9",
    title: "Figura Funko colección",
    categoryId: "hobbies",
    priceColones: 12_000,
    condition: "nuevo",
  },
  {
    id: "l10",
    title: "Vestido fiesta talla M",
    categoryId: "moda",
    priceColones: 28_000,
    condition: "como_nuevo",
  },
];
