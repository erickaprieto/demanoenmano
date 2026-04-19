"use client";

import { AppLogo } from "@/components/branding/AppLogo";
import { textWithBrandItalic } from "@/components/branding/BrandName";
import { TermsScroll } from "@/components/legal/TermsScroll";
import { getOrCreateDemoUserId } from "@/lib/demoUserId";
import { markTermsAcceptedLocal } from "@/lib/legalProfile";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function hasTermsCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith("vibe_accepted_terms=1"));
}

export function WelcomeTermsClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const suspension = searchParams.get("suspension");
  const showBackToWelcome =
    !suspension && pathname?.includes("/bienvenida/terminos");

  const [custody, setCustody] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [contact, setContact] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  useEffect(() => {
    if (hasTermsCookie()) setAlreadyAccepted(true);
  }, []);

  const canSubmit = custody && shipping && contact;

  const submit = useCallback(async () => {
    setError(null);
    if (!canSubmit) {
      setError("Debés seleccionar las tres casillas obligatorias para continuar.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/terms-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getOrCreateDemoUserId(),
          checks: { custody, shipping, contact },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "No se pudo registrar la aceptación.",
        );
        return;
      }
      markTermsAcceptedLocal();
      window.location.assign("/");
    } finally {
      setLoading(false);
    }
  }, [canSubmit, custody, shipping, contact]);

  if (suspension === "perm") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-obsidian px-5 py-10 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Cuenta suspendida
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          {textWithBrandItalic(
            "Tu cuenta está bajo revisión permanente por incumplimientos reiterados de las políticas de envío de De Mano en Mano (tercera infracción).",
          )}
        </p>
        <p className="mt-3 text-xs text-zinc-600">
          Los datos de registro asociados a este perfil quedan bloqueados según
          los Términos y Condiciones.
        </p>
      </div>
    );
  }

  if (suspension === "temp") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-obsidian px-5 py-10 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Baneo temporal (7 días)
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Incumpliste el plazo de envío sin registrar guía en Correos. Según los
          términos, se aplicó un bloqueo temporal de 7 días naturales y el
          reintegro automático al comprador cuando correspondía.
        </p>
        <p className="mt-6 text-xs text-zinc-600">
          Cuando venza el plazo podrás volver a ingresar con la misma sesión si
          no hay nuevas infracciones.
        </p>
      </div>
    );
  }

  if (alreadyAccepted) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-obsidian px-5 py-10 text-center">
        <h1 className="text-xl font-semibold text-white">Ya aceptaste los términos</h1>
        <p className="mt-3 text-sm text-zinc-500">
          {textWithBrandItalic("Podés continuar usando De Mano en Mano en esta sesión.")}
        </p>
        <button
          type="button"
          onClick={() => router.replace("/")}
          className="mt-8 rounded-2xl bg-violet-electric px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-obsidian px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      {showBackToWelcome ? (
        <div className="mb-3 shrink-0">
          <button
            type="button"
            onClick={() => router.push("/bienvenida")}
            className="text-xs font-medium text-zinc-500 transition hover:text-violet-electric"
          >
            ← Volver a Bienvenid@
          </button>
        </div>
      ) : null}
      <header className="mb-4 flex shrink-0 flex-col items-center text-center">
        <AppLogo size={80} priority className="drop-shadow-[0_0_20px_rgba(138,43,226,0.3)]" />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-violet-electric">
          Bienvenid@
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Registro y términos
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Leé el texto completo y confirmá las tres declaraciones obligatorias para usar
          &apos;
          {textWithBrandItalic("De Mano en Mano")}
          &apos;.
        </p>
      </header>

      <div className="flex min-h-[42dvh] flex-1 flex-col gap-4">
        <TermsScroll />
      </div>

      <div className="mt-5 shrink-0 space-y-3 rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4 ring-1 ring-white/[0.04]">
        <label className="flex cursor-pointer gap-3 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={custody}
            onChange={(e) => setCustody(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-white/20 bg-obsidian text-violet-electric"
          />
          <span>
            {textWithBrandItalic(
              "Acepto la custodia de fondos por De Mano en Mano (liberación al registrar la guía de Correos en la app, según términos).",
            )}
          </span>
        </label>
        <label className="flex cursor-pointer gap-3 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={shipping}
            onChange={(e) => setShipping(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-white/20 bg-obsidian text-violet-electric"
          />
          <span>
            Acepto el plazo de 3 días hábiles para envíos bajo pena de baneo.
          </span>
        </label>
        <label className="flex cursor-pointer gap-3 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={contact}
            onChange={(e) => setContact(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-white/20 bg-obsidian text-violet-electric"
          />
          <span>Acepto no compartir datos de contacto fuera de la app.</span>
        </label>
      </div>

      {error ? (
        <p className="mt-3 text-center text-sm text-[#FF4B4B]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={loading}
        onClick={() => void submit()}
        className="mt-5 w-full rounded-2xl bg-violet-electric py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(138,43,226,0.5)] transition hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Guardando…" : "Aceptar y continuar"}
      </button>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-600">
        {textWithBrandItalic(
          "Al continuar declarás haber leído los Términos y Condiciones de De Mano en Mano Costa Rica.",
        )}
      </p>
    </div>
  );
}
