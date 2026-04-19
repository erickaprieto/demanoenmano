"use client";

import { AppLogo } from "@/components/branding/AppLogo";
import { textWithBrandItalic } from "@/components/branding/BrandName";
import { CyberTropicalShell } from "@/components/registro/CyberTropicalShell";
import { signUpFieldClass } from "@/components/registro/signUpFieldStyles";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";

export function LoginScreen() {
  const formId = useId();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      const next = search.get("next");
      router.push(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch {
      setError("Error de red. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CyberTropicalShell>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col items-center pt-4">
          <AppLogo size={92} priority />
        </div>
        <h1 className="mt-8 text-center text-2xl font-semibold tracking-tight text-white">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          {textWithBrandItalic("Logueate con tu cuenta de De Mano en Mano.")}
        </p>

        <form className="mt-10 flex flex-1 flex-col gap-5" onSubmit={submit} noValidate>
          {error ? (
            <p className="text-center text-xs text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <div>
            <label htmlFor={`${formId}-email`} className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Correo
            </label>
            <input
              id={`${formId}-email`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${signUpFieldClass} mt-1.5 w-full`}
              placeholder="vos@correo.com"
              required
            />
          </div>
          <div>
            <label htmlFor={`${formId}-password`} className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Contraseña
            </label>
            <input
              id={`${formId}-password`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${signUpFieldClass} mt-1.5 w-full`}
              placeholder="Tu contraseña"
              required
            />
          </div>

          <div className="mt-auto flex flex-col gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-neon-green py-4 text-base font-bold text-black transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <Link href="/recuperar" className="text-center text-sm text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
            <p className="text-center text-sm text-zinc-500">
              ¿No tenés cuenta?{" "}
              <Link href="/registro" className="text-white underline decoration-violet-electric/50 underline-offset-4">
                Crear cuenta
              </Link>
            </p>
          </div>
        </form>
      </div>
    </CyberTropicalShell>
  );
}
