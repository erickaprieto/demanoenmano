"use client";

import { AppLogo } from "@/components/branding/AppLogo";
import { dismissUsageGuide } from "@/lib/usageGuideDismissed";
import {
  GalleryHorizontal,
  HandCoins,
  HelpCircle,
  Package,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useCallback, useState } from "react";

type Step = {
  title: string;
  body: string;
  Icon: typeof HandCoins;
};

const STEPS: Step[] = [
  {
    title: "Descubrí productos",
    body: "En Inicio, si te gusta el producto, deslizalo a la derecha te interesa, si no te gusta, lo deslizas a la izquierda pasás.",
    Icon: GalleryHorizontal,
  },
  {
    title: "Buscá y armá tu carrito",
    body: "Usá Buscar cuando quieras filtrar. El Carrito agrupa lo que vas sumando antes de pagar. Todo queda en la misma app.",
    Icon: HandCoins,
  },
  {
    title: "Vendé con claridad",
    body: "En Vendé cargá fotos reales y respondé la ficha con honestidad. Para algunas categorías puede pedirse video de funcionamiento: ayuda a evitar disputas.",
    Icon: Store,
  },
  {
    title: "Pago seguro y Correos",
    body: "Los pagos van por la pasarela de la plataforma: no compartas SINPE ni efectivo fuera de la app. El envío se gestiona con Correos de Costa Rica y la guía se registra acá.",
    Icon: ShieldCheck,
  },
  {
    title: "Perfil y Ayuda",
    body: "En Perfil tenés compras, ventas y ajustes. Si algo no te cierra, abrí Ayuda desde ahí para repasar envíos, plazos y buenas prácticas.",
    Icon: HelpCircle,
  },
  {
    title: "Plazos de envío",
    body: "Si vendés, tenés hasta 3 días hábiles para llevar el paquete a Correos y cargar la guía. Si no se cumple, el comprador puede recibir reintegro y aplican las sanciones de los términos.",
    Icon: Package,
  },
];

type UsageGuideOverlayProps = {
  onClose: () => void;
};

export function UsageGuideOverlay({ onClose }: UsageGuideOverlayProps) {
  const [index, setIndex] = useState(0);
  const last = index === STEPS.length - 1;
  const step = STEPS[index]!;
  const StepIcon = step.Icon;

  const finish = useCallback(() => {
    dismissUsageGuide();
    onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-obsidian/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="usage-guide-title"
      aria-describedby="usage-guide-desc"
    >
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <AppLogo size={44} priority={false} />
        <button
          type="button"
          onClick={finish}
          className="text-xs font-medium uppercase tracking-wider text-zinc-500 transition hover:text-zinc-300"
        >
          Omitir
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div
            className="flex size-20 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#1A1A1A] text-violet-electric shadow-[0_0_32px_-8px_rgba(138,43,226,0.45)] ring-1 ring-violet-electric/25"
            aria-hidden
          >
            <StepIcon className="size-10" strokeWidth={1.35} />
          </div>
          <h2
            id="usage-guide-title"
            className="mt-8 text-xl font-semibold tracking-tight text-white"
          >
            {step.title}
          </h2>
          <p
            id="usage-guide-desc"
            className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400"
          >
            {step.body}
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`size-2.5 rounded-full transition ${
                i === index
                  ? "bg-violet-electric shadow-[0_0_12px_rgba(138,43,226,0.7)]"
                  : "bg-zinc-700 hover:bg-zinc-500"
              }`}
              aria-label={`Paso ${i + 1} de ${STEPS.length}`}
              aria-current={i === index ? "step" : undefined}
            />
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          {index > 0 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="flex-1 rounded-2xl border border-white/12 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-violet-electric/40 hover:text-white"
            >
              Atrás
            </button>
          ) : (
            <span className="flex-1" aria-hidden />
          )}
          <button
            type="button"
            onClick={() => (last ? finish() : setIndex((i) => i + 1))}
            className="min-w-[9.5rem] flex-1 rounded-2xl bg-violet-electric py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(138,43,226,0.55)] transition hover:brightness-110"
          >
            {last ? "¡Listo!" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
