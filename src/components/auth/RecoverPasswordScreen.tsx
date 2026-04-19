"use client";

import { AppLogo } from "@/components/branding/AppLogo";
import { CyberTropicalShell } from "@/components/registro/CyberTropicalShell";
import { signUpFieldClass } from "@/components/registro/signUpFieldStyles";
import { validateUserPassword } from "@/lib/auth/passwordPolicy";
import Link from "next/link";
import { useId, useState } from "react";

type ForgotResponse = {
  error?: string;
  devResetToken?: string;
  expiresAt?: string;
};

export function RecoverPasswordScreen() {
  const formId = useId();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json().catch(() => ({}))) as ForgotResponse;
    if (!res.ok) {
      setErr(data.error ?? "No se pudo iniciar recuperación.");
      return;
    }
    setDevToken(data.devResetToken ?? null);
    setMsg("Si el correo existe, enviamos instrucciones para recuperar contraseña.");
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const pwdCheck = validateUserPassword(password);
    if (!pwdCheck.ok) {
      setErr(pwdCheck.error);
      return;
    }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "No se pudo cambiar la contraseña.");
      return;
    }
    setMsg("Contraseña actualizada. Ya podés iniciar sesión.");
    setToken("");
    setPassword("");
  };

  return (
    <CyberTropicalShell>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col items-center pt-4">
          <AppLogo size={88} priority />
        </div>
        <h1 className="mt-8 text-center text-2xl font-semibold text-white">
          Recuperar contraseña
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Te ayudamos a recuperar tu acceso de forma segura.
        </p>

        {msg ? <p className="mt-5 rounded-xl border border-neon-green/30 bg-neon-green/10 px-3 py-2 text-xs text-neon-green">{msg}</p> : null}
        {err ? <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{err}</p> : null}

        <form className="mt-6 space-y-4" onSubmit={requestReset}>
          <label htmlFor={`${formId}-email`} className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Correo de tu cuenta
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${signUpFieldClass} w-full`}
            placeholder="vos@correo.com"
            required
          />
          <button type="submit" className="w-full rounded-2xl bg-violet-electric py-3 text-sm font-semibold text-white">
            Enviar recuperación
          </button>
        </form>

        {devToken ? (
          <p className="mt-3 rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-[11px] text-zinc-300">
            Token de desarrollo: <span className="font-mono">{devToken}</span>
          </p>
        ) : null}

        <form className="mt-8 space-y-4" onSubmit={resetPassword}>
          <label htmlFor={`${formId}-token`} className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Token de recuperación
          </label>
          <input
            id={`${formId}-token`}
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className={`${signUpFieldClass} w-full font-mono`}
            placeholder="Pegá aquí tu token"
            required
          />
          <label htmlFor={`${formId}-new-password`} className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Nueva contraseña
          </label>
          <input
            id={`${formId}-new-password`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${signUpFieldClass} w-full`}
            placeholder="10+ caracteres: mayús., minús., 3 números, !# $%&"
            minLength={10}
            required
          />
          <button type="submit" className="w-full rounded-2xl bg-neon-green py-3 text-sm font-semibold text-black">
            Cambiar contraseña
          </button>
        </form>

        <Link href="/login" className="mt-6 text-center text-sm text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    </CyberTropicalShell>
  );
}
