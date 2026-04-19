"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  SELL_CATEGORY_OPTIONS,
  SELL_CATEGORY_OTRO_ID,
} from "@/data/sellCategories";

const SELL_CATEGORY_MASCOTAS_ID = "mascotas";

type SellCategorySelectorProps = {
  idPrefix: string;
  value: string;
  onChange: (categoryId: string) => void;
  otherValue: string;
  onOtherChange: (text: string) => void;
  errorCategory?: string;
  errorOther?: string;
  /** Si se pasa (p. ej. taxonomía desde API), reemplaza el catálogo estático. */
  categoryOptions?: readonly { id: string; label: string }[];
};

const selectBase =
  "w-full appearance-none rounded-2xl border-2 bg-[#141414] bg-[length:1.125rem] bg-[right_1rem_center] bg-no-repeat px-4 py-3.5 pr-11 text-sm font-medium text-white outline-none transition focus-visible:ring-2 focus-visible:ring-violet-electric/35";

export function SellCategorySelector({
  idPrefix,
  value,
  onChange,
  otherValue,
  onOtherChange,
  errorCategory,
  errorOther,
  categoryOptions = SELL_CATEGORY_OPTIONS,
}: SellCategorySelectorProps) {
  const hasSelection = value !== "";
  const isOtro = value === SELL_CATEGORY_OTRO_ID;

  const selectId = `${idPrefix}-sell-category`;

  const borderClass = hasSelection
    ? "border-violet-electric shadow-[0_0_0_1px_rgba(138,43,226,0.22)]"
    : "border-white/[0.12] hover:border-white/20";

  const chevron =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%23e4e4e7' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-obsidian-elevated/80 p-4 ring-1 ring-white/[0.04]">
      <label
        htmlFor={selectId}
        className="block text-base font-semibold tracking-tight text-white"
      >
        ¿Qué vas a vender?
      </label>
      <p className="mt-1 text-xs text-zinc-500">
        Elegí la categoría que mejor describe tu artículo.
      </p>

      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${selectBase} mt-4 ${borderClass}`}
        style={{ backgroundImage: chevron }}
        aria-invalid={Boolean(errorCategory)}
        aria-describedby={errorCategory ? `${selectId}-err` : undefined}
      >
        <option value="" disabled className="bg-zinc-900 text-zinc-500">
          Seleccioná una categoría
        </option>
        {categoryOptions.map((opt) => (
          <option
            key={opt.id}
            value={opt.id}
            className="bg-zinc-900 text-white"
          >
            {opt.label}
          </option>
        ))}
      </select>
      {errorCategory ? (
        <p id={`${selectId}-err`} className="mt-2 text-xs text-red-400" role="alert">
          {errorCategory}
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {value === SELL_CATEGORY_MASCOTAS_ID ? (
          <motion.div
            key="mascotas-policy"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="mt-3 rounded-xl border border-violet-electric/25 bg-violet-electric/10 px-3 py-2.5 text-left text-[11px] leading-snug text-violet-100"
            role="note"
          >
            <span className="font-semibold text-white">Política De Mano en Mano:</span> en
            Mascotas solo publicamos{" "}
            <span className="text-white">accesorios</span> (correas, camas,
            juguetes, transportadoras, etc.).{" "}
            <span className="text-white">No aceptamos alimentos</span> ni
            suplementos.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {isOtro ? (
          <motion.div
            key="otro-spec"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="mt-4 overflow-hidden"
          >
            <label
              htmlFor={`${idPrefix}-sell-other`}
              className="text-xs font-medium text-zinc-300"
            >
              Especifique qué tipo de artículo es
            </label>
            <input
              id={`${idPrefix}-sell-other`}
              type="text"
              value={otherValue}
              onChange={(e) => onOtherChange(e.target.value)}
              className="mt-1.5 w-full rounded-xl border-2 border-white/[0.12] bg-[#141414] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus-visible:border-violet-electric focus-visible:ring-2 focus-visible:ring-violet-electric/30"
              placeholder="Ej. Instrumento musical, pieza de repuesto…"
              aria-required={isOtro}
              aria-invalid={Boolean(errorOther)}
            />
            {errorOther ? (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {errorOther}
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
