"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import {
  CATEGORY_SHEET_OPTIONS,
  CONDITION_OPTIONS,
  PRICE_OPTIONS,
  type QuickFilterKey,
} from "./searchFilterConfig";

type CatOpt = { id: string | null; label: string };

type Props = {
  open: QuickFilterKey | null;
  onClose: () => void;
  categoryId: string | null;
  onPickCategory: (id: string | null) => void;
  priceId: string;
  onPickPrice: (id: string) => void;
  conditionId: string;
  onPickCondition: (id: string) => void;
  /** Si no se pasa, se usan categorías estáticas del bundle. */
  categorySheetOptions?: readonly CatOpt[];
};

const titles: Record<QuickFilterKey, string> = {
  categoria: "Categoría",
  precio: "Precio",
  estado: "Estado del artículo",
};

export function SearchFilterSheet({
  open,
  onClose,
  categoryId,
  onPickCategory,
  priceId,
  onPickPrice,
  conditionId,
  onPickCondition,
  categorySheetOptions = CATEGORY_SHEET_OPTIONS,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-sheet-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            aria-label="Cerrar filtros"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 max-h-[min(78dvh,32rem)] overflow-hidden rounded-t-3xl border border-white/[0.1] bg-[#242424] shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <h2
                id="search-sheet-title"
                className="text-base font-semibold text-white"
              >
                {titles[open]}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Cerrar"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>
            <div className="max-h-[min(62dvh,26rem)] overflow-y-auto overscroll-y-contain px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
              {open === "categoria"
                ? categorySheetOptions.map((opt) => {
                    const active =
                      (opt.id === null && categoryId === null) ||
                      opt.id === categoryId;
                    return (
                      <button
                        key={opt.id ?? "__all__"}
                        type="button"
                        onClick={() => {
                          onPickCategory(opt.id);
                          onClose();
                        }}
                        className={`mb-1 flex w-full items-center rounded-xl px-4 py-3.5 text-left text-sm transition ${
                          active
                            ? "border border-violet-electric bg-violet-electric/10 font-medium text-neon-green"
                            : "border border-transparent text-zinc-200 hover:bg-white/[0.04]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })
                : null}
              {open === "precio"
                ? PRICE_OPTIONS.map((opt) => {
                    const active = opt.id === priceId;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onPickPrice(opt.id);
                          onClose();
                        }}
                        className={`mb-1 flex w-full items-center rounded-xl px-4 py-3.5 text-left text-sm transition ${
                          active
                            ? "border border-violet-electric bg-violet-electric/10 font-medium text-neon-green"
                            : "border border-transparent text-zinc-200 hover:bg-white/[0.04]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })
                : null}
              {open === "estado"
                ? CONDITION_OPTIONS.map((opt) => {
                    const active = opt.id === conditionId;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onPickCondition(opt.id);
                          onClose();
                        }}
                        className={`mb-1 flex w-full items-center rounded-xl px-4 py-3.5 text-left text-sm transition ${
                          active
                            ? "border border-violet-electric bg-violet-electric/10 font-medium text-neon-green"
                            : "border border-transparent text-zinc-200 hover:bg-white/[0.04]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })
                : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
