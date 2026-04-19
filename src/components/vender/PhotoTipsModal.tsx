"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  type LucideIcon,
  Sparkles,
  Square,
  Sun,
  View,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { writePhotoTipsPermanentlyDismissed } from "@/lib/photoTipsPreferences";

type VibePhotoTip = {
  id: string;
  title: string;
  body: string;
  Icon: LucideIcon;
};

const VIBE_PHOTO_TIPS: VibePhotoTip[] = [
  {
    id: "neutral",
    title: "Fondo neutro",
    body: "Una pared lisa o tela sin estampados ayuda a que la prenda sea la protagonista.",
    Icon: Square,
  },
  {
    id: "light",
    title: "Luz natural",
    body: "Cerca de una ventana, sin flash duro: los colores y texturas se ven más fieles.",
    Icon: Sun,
  },
  {
    id: "angles",
    title: "Todos los ángulos",
    body: "Frente, espalda, etiquetas y detalles: el comprador confía cuando ve el producto completo.",
    Icon: View,
  },
  {
    id: "honest",
    title: "Honestidad con los detalles",
    body: "Mostrá manchas, desgaste o arreglos. Evitás devoluciones y reseñas negativas.",
    Icon: BadgeCheck,
  },
  {
    id: "lens",
    title: "Limpiar lente",
    body: "Un paño suave en la cámara del celular: menos bruma y fotos más nítidas al instante.",
    Icon: Sparkles,
  },
];

type PhotoTipsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function PhotoTipsModal({ open, onClose }: PhotoTipsModalProps) {
  const baseId = useId();
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [carouselEl, setCarouselEl] = useState<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setDontShowAgain(false);
        setActiveIndex(0);
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const root = carouselEl;
    if (!root || !open) return;
    const cards = [
      ...root.querySelectorAll<HTMLElement>("[data-tip-card]"),
    ];
    if (!cards.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!hit?.target) return;
        const idx = cards.indexOf(hit.target as HTMLElement);
        if (idx >= 0) setActiveIndex(idx);
      },
      { root, rootMargin: "0px -12% 0px -12%", threshold: [0.35, 0.55, 0.75] },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [carouselEl, open]);

  const handleDismiss = () => {
    if (dontShowAgain) writePhotoTipsPermanentlyDismissed();
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="photo-tips-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${baseId}-title`}
          className="fixed inset-0 z-[85] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
          style={{
            backgroundColor: "rgba(10, 10, 10, 0.9)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div
            className="absolute inset-0 backdrop-blur-md"
            aria-hidden
          />
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08] bg-obsidian-elevated/95 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06]"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="border-b border-white/[0.06] px-5 pb-4 pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-electric">
                Consejos de fotos
              </p>
              <h2
                id={`${baseId}-title`}
                className="mt-1.5 text-lg font-semibold tracking-tight text-white"
              >
                Tips de fotografía
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Deslizá las tarjetas para ver cada consejo antes de subir tus archivos.
              </p>
            </div>

            <div
              ref={setCarouselEl}
              className="flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {VIBE_PHOTO_TIPS.map((tip, idx) => (
                <article
                  key={tip.id}
                  data-tip-card
                  className="w-[min(100%,280px)] shrink-0 snap-center rounded-2xl border border-white/[0.06] bg-black/40 p-4 ring-1 ring-white/[0.04]"
                  aria-current={idx === activeIndex ? "true" : undefined}
                >
                  <div
                    className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]"
                    aria-hidden
                  >
                    <tip.Icon
                      className="size-5 text-neon-green"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{tip.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    {tip.body}
                  </p>
                </article>
              ))}
            </div>

            <div
              className="flex justify-center gap-1.5 px-4 pb-2"
              aria-hidden
            >
              {VIBE_PHOTO_TIPS.map((tip, i) => (
                <span
                  key={tip.id}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex
                      ? "w-5 bg-violet-electric"
                      : "w-1.5 bg-zinc-600"
                  }`}
                />
              ))}
            </div>

            <div className="space-y-4 border-t border-white/[0.06] px-5 py-4">
              <label className="flex cursor-pointer items-start gap-2.5 text-left">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="mt-0.5 size-3.5 shrink-0 rounded border-zinc-600 bg-obsidian text-violet-electric focus:ring-violet-electric/40"
                />
                <span className="text-[11px] leading-snug text-zinc-500">
                  No volver a mostrar estos tips
                </span>
              </label>

              <button
                type="button"
                onClick={handleDismiss}
                className="flex w-full items-center justify-center rounded-2xl bg-violet-electric py-3.5 text-sm font-semibold text-white shadow-[0_0_28px_-6px_rgba(138,43,226,0.55)] transition hover:brightness-110 active:scale-[0.99]"
              >
                ¡Entendido, vamos a las fotos!
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
