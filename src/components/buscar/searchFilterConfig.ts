import { SELL_CATEGORY_OPTIONS } from "@/data/sellCategories";
import { formatPrecioCRC } from "@/lib/formatColones";

export type QuickFilterKey = "categoria" | "precio" | "estado";

const crc = formatPrecioCRC;

export const PRICE_OPTIONS = [
  { id: "any", label: "Cualquier precio", min: null, max: null },
  {
    id: "0-25k",
    label: `${crc(0)} – ${crc(25_000)}`,
    min: 0,
    max: 25_000,
  },
  {
    id: "25k-50k",
    label: `${crc(25_001)} – ${crc(50_000)}`,
    min: 25_001,
    max: 50_000,
  },
  {
    id: "50k-100k",
    label: `${crc(50_001)} – ${crc(100_000)}`,
    min: 50_001,
    max: 100_000,
  },
  {
    id: "100k+",
    label: `Más de ${crc(100_000)}`,
    min: 100_001,
    max: null,
  },
] as const;

export const CONDITION_OPTIONS = [
  { id: "any", label: "Cualquier estado" },
  { id: "nuevo", label: "Nuevo" },
  { id: "como_nuevo", label: "Como nuevo" },
  { id: "usado", label: "Usado" },
] as const;

export const CATEGORY_SHEET_OPTIONS = [
  { id: null as string | null, label: "Todas las categorías" },
  ...SELL_CATEGORY_OPTIONS.map((c) => ({ id: c.id, label: c.label })),
];
