"use client";

import { AppLogo } from "@/components/branding/AppLogo";
import { GradientBackdrop } from "@/components/ui/GradientBackdrop";
import { Gem } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/** Alineado con @theme — Verde Neón de marca */
const NEON = "#33ff00";
const VIOLET = "#8a2be2";

const CAROUSEL_MS = 5200;

/** Mano + símbolo ₡ — estilo vector minimal, neón */
function HandColonesIcon({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      <svg viewBox="0 0 56 56" className="size-full" fill="none">
        {/* Palma + dedos sugeridos */}
        <path
          d="M14 34c0-4 3-7 7-7h2.5M21 27V17c0-2.2 1.5-4 3.5-4s3.5 1.8 3.5 4v9"
          stroke={NEON}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28.5 22v11c0 3 2.5 5.5 5.5 5.5H38"
          stroke={NEON}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M32 24.5V15c0-1.7 1.2-3 2.8-3s2.7 1.3 2.7 3v12"
          stroke={NEON}
          strokeWidth="1.45"
          strokeLinecap="round"
        />
        <path
          d="M37.5 27V19c0-1.4 1-2.4 2.3-2.4s2.2 1 2.2 2.4v11.5"
          stroke={NEON}
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <path
          d="M14 34c2 3 5.5 5 9.5 5h6"
          stroke={NEON}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Moneda / colones flotando sobre la mano */}
        <circle
          cx="30"
          cy="16"
          r="9"
          stroke={NEON}
          strokeWidth="1.35"
          opacity="0.9"
        />
        <text
          x="30"
          y="20"
          textAnchor="middle"
          fill={NEON}
          fontSize="11"
          fontWeight="800"
          fontFamily="system-ui, sans-serif"
        >
          ₡
        </text>
      </svg>
    </span>
  );
}

/** Candado minimal + hoja neón (marca De Mano en Mano). */
function LockLeafIcon({ className }: { className?: string }) {
  return (
    <span className={`relative inline-flex ${className ?? ""}`} aria-hidden>
      <svg viewBox="0 0 48 48" className="size-full" fill="none">
        <rect
          x="12"
          y="20"
          width="24"
          height="20"
          rx="3"
          stroke={NEON}
          strokeWidth="1.75"
          opacity="0.95"
        />
        <path
          d="M17 20V14a7 7 0 0 1 14 0v6"
          stroke={NEON}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <ellipse
          cx="31"
          cy="12"
          rx="7"
          ry="4.5"
          fill={NEON}
          opacity="0.35"
          transform="rotate(-28 31 12)"
        />
        <path
          d="M28 8c2.5-1 6-0.5 7.5 2.2 1.2 2.2 0.4 4.6-1.8 6.2-2.5 1.8-6 2-8.5 0.5"
          stroke={NEON}
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

const BENEFIT_CARDS = [
  {
    key: "sell",
    icon: (
      <div className="relative flex size-[3.25rem] items-center justify-center">
        <span
          className="absolute inset-0 rounded-2xl bg-neon-green/12 blur-xl"
          aria-hidden
        />
        <HandColonesIcon className="relative size-14 drop-shadow-[0_0_14px_rgba(51,255,0,0.45)]" />
      </div>
    ),
    body: "Vende lo que ya no usas y genera dinero",
  },
  {
    key: "buy",
    icon: (
      <div className="relative flex size-[3.25rem] items-center justify-center">
        <span
          className="absolute inset-0 rounded-2xl bg-violet-electric/18 blur-xl"
          aria-hidden
        />
        <Gem
          className="relative size-14"
          strokeWidth={1.35}
          style={{
            color: VIOLET,
            filter: "drop-shadow(0 0 12px rgba(138,43,226,0.55))",
          }}
          aria-hidden
        />
      </div>
    ),
    body: "Encuentra tesoros únicos de segunda mano con estilo.",
  },
  {
    key: "safe",
    icon: (
      <div className="relative flex size-[3.25rem] items-center justify-center">
        <span
          className="absolute inset-0 rounded-2xl bg-neon-green/10 blur-xl"
          aria-hidden
        />
        <LockLeafIcon className="relative size-14 drop-shadow-[0_0_14px_rgba(51,255,0,0.4)]" />
      </div>
    ),
    body: "Tu dinero protegido con el pago seguro De Mano en Mano. ¡Cero estafas!",
  },
];

export function WelcomeOpportunityScreen() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % BENEFIT_CARDS.length);
    }, CAROUSEL_MS);
    return () => window.clearInterval(id);
  }, []);

  const goGuest = useCallback(() => {
    router.push("/bienvenida/terminos");
  }, [router]);

  return (
    <div
      className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col overflow-hidden bg-[#050506] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 120% 80% at 50% -15%, rgba(138,43,226,0.14), transparent 50%), radial-gradient(ellipse 90% 60% at 100% 40%, rgba(138,43,226,0.08), transparent 45%), radial-gradient(ellipse 70% 50% at 0% 70%, rgba(138,43,226,0.06), transparent 40%)",
      }}
    >
      <GradientBackdrop />
      {/* Capa extra: degradados violeta fluidos sobre obsidiana */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.85]"
        aria-hidden
      >
        <div className="absolute -left-[30%] -top-[20%] h-[min(120vw,480px)] w-[min(120vw,480px)] rounded-full bg-gradient-to-br from-violet-electric/30 via-violet-600/12 to-transparent blur-[100px]" />
        <div className="absolute -right-[35%] top-[25%] h-[min(100vw,420px)] w-[min(100vw,420px)] rounded-full bg-gradient-to-tl from-violet-500/22 via-fuchsia-600/10 to-transparent blur-[110px]" />
        <div className="absolute bottom-[-20%] left-[5%] h-[min(90vw,360px)] w-[min(90vw,360px)] rounded-full bg-gradient-to-tr from-violet-electric/18 to-transparent blur-[85px]" />
      </div>

      <header className="relative z-10 flex flex-col items-center pt-1 text-center">
        <div className="rounded-full p-1.5 ring-1 ring-white/[0.08] vibe-onboarding-logo-ring">
          <AppLogo
            size={96}
            priority
            className="rounded-full vibe-onboarding-logo-image"
          />
        </div>
        <h1 className="mt-9 text-pretty text-[1.7rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-[1.85rem]">
          Vibra. Reutiliza. Gana.
        </h1>
      </header>

      <section
        className="relative z-10 mt-10 flex-1"
        aria-roledescription="carrusel"
        aria-label="Beneficios de De Mano en Mano"
      >
        <p className="sr-only" aria-live="polite">
          {BENEFIT_CARDS[slide]?.body}
        </p>
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-[720ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: `translate3d(-${slide * 100}%,0,0)`,
            }}
          >
            {BENEFIT_CARDS.map((card, i) => {
              const active = i === slide;
              return (
                <article key={card.key} className="w-full shrink-0">
                  <div className="mx-auto flex min-h-[12rem] max-w-sm flex-col items-center justify-center rounded-2xl border border-white/[0.09] bg-white/[0.04] px-6 py-8 text-center backdrop-blur-md">
                    <div
                      className={`mb-5 flex min-h-[4rem] items-center justify-center will-change-transform ${
                        active ? "vibe-onboarding-carousel-icon" : ""
                      }`}
                    >
                      {card.icon}
                    </div>
                    <p
                      className={`text-[15px] font-medium leading-snug text-white/95 will-change-transform ${
                        active ? "vibe-onboarding-carousel-text" : ""
                      }`}
                    >
                      {card.body}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <div
          className="mt-5 flex justify-center gap-2"
          role="tablist"
          aria-label="Indicadores del carrusel"
        >
          {BENEFIT_CARDS.map((c, i) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={i === slide}
              aria-label={`Tarjeta ${i + 1}`}
              onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === slide
                  ? "w-8 bg-neon-green shadow-[0_0_14px_rgba(51,255,0,0.55)]"
                  : "w-2 bg-zinc-600/90 hover:bg-zinc-500"
              }`}
            />
          ))}
        </div>
      </section>

      <footer className="relative z-10 mt-auto space-y-3 pt-8">
        <Link
          href="/bienvenida/terminos"
          className="flex w-full items-center justify-center rounded-2xl bg-neon-green py-4 text-[15px] font-semibold text-[#0a0a0b] shadow-[0_0_36px_-4px_rgba(51,255,0,0.55),0_4px_24px_rgba(51,255,0,0.15)] transition hover:brightness-110 active:scale-[0.99]"
        >
          ¡Empezar a Vibrar!
        </Link>
        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-2xl border border-violet-electric/90 bg-transparent py-3.5 text-sm font-semibold text-white/95 transition hover:border-violet-electric hover:bg-violet-electric/10"
        >
          Ya tengo cuenta, Iniciar Sesión
        </Link>
        <button
          type="button"
          onClick={() => goGuest()}
          className="w-full pt-1 text-center text-[13px] font-medium text-white/55 transition hover:text-white/85"
        >
          O explora primero como invitado
        </button>
      </footer>
    </div>
  );
}
