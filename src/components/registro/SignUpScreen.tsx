"use client";

import { AppLogo } from "@/components/branding/AppLogo";
import { saveSignupDraft } from "@/lib/signupDraft";
import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { isUserPasswordValid } from "@/lib/auth/passwordPolicy";
import { CyberTropicalShell } from "./CyberTropicalShell";
import { signUpFieldClass, signUpFieldInvalidClass } from "./signUpFieldStyles";

function validName(s: string) {
  return s.trim().length >= 3;
}
function validEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
function validPhone(s: string) {
  const d = s.replace(/\D/g, "");
  return d.length >= 8;
}

function FieldCheck({ ok }: { ok: boolean }) {
  if (!ok) {
    return <span className="size-5 shrink-0" aria-hidden />;
  }
  return (
    <CircleCheck
      className="size-5 shrink-0 text-neon-green drop-shadow-[0_0_10px_rgba(51,255,0,0.55)]"
      strokeWidth={2}
      aria-label="Campo válido"
    />
  );
}

export function SignUpScreen() {
  const formId = useId();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameOk = useMemo(() => validName(fullName), [fullName]);
  const emailOk = useMemo(() => validEmail(email), [email]);
  const phoneOk = useMemo(() => validPhone(phone), [phone]);
  const passwordOk = useMemo(() => isUserPasswordValid(password), [password]);
  const nameInvalid = fullName.length > 0 && !nameOk;
  const emailInvalid = email.length > 0 && !emailOk;
  const phoneInvalid = phone.length > 0 && !phoneOk;
  const passwordInvalid = password.length > 0 && !passwordOk;
  const password2Invalid = password2.length > 0 && password2 !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nameOk || !emailOk || !phoneOk || !passwordOk) {
      setError(
        "Completá los campos correctamente. Contraseña: mínimo 10 caracteres, 1 mayúscula, 1 minúscula, 3 números y 1 especial (! # $ % &).",
      );
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    saveSignupDraft({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear tu cuenta.");
        return;
      }
      router.push("/registro/correos");
      router.refresh();
    } catch {
      setError("Error de red al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CyberTropicalShell>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col items-center pt-2">
          <AppLogo
            size={96}
            priority
            className="drop-shadow-[0_0_32px_rgba(138,43,226,0.45)]"
          />
        </div>

        <h1 className="mt-8 text-center text-2xl font-semibold tracking-tight text-white">
          Únete a la Vibración
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500">
          Registro rápido. Después completás el envío con Correos de Costa Rica.
        </p>

        <form
          className="mt-10 flex flex-1 flex-col gap-5"
          onSubmit={submit}
          noValidate
        >
          {error ? (
            <p className="text-center text-xs text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <div>
            <label
              htmlFor={`${formId}-name`}
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Nombre completo
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id={`${formId}-name`}
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`${signUpFieldClass} min-w-0 flex-1 ${nameInvalid ? signUpFieldInvalidClass : ""}`}
                placeholder="Como figura en tu cédula"
                aria-invalid={nameInvalid}
              />
              <FieldCheck ok={nameOk} />
            </div>
          </div>

          <div>
            <label
              htmlFor={`${formId}-password`}
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Contraseña
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id={`${formId}-password`}
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${signUpFieldClass} min-w-0 flex-1 ${passwordInvalid ? signUpFieldInvalidClass : ""}`}
                placeholder="10+ caracteres: mayús., minús., 3 números, ! # $ % &"
                aria-invalid={passwordInvalid}
              />
              <FieldCheck ok={passwordOk} />
            </div>
          </div>

          <div>
            <label
              htmlFor={`${formId}-password2`}
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Repetir contraseña
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id={`${formId}-password2`}
                name="password2"
                type="password"
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className={`${signUpFieldClass} min-w-0 flex-1 ${password2Invalid ? signUpFieldInvalidClass : ""}`}
                placeholder="Repetí tu contraseña"
                aria-invalid={password2Invalid}
              />
              <FieldCheck ok={password2.length > 0 && password2 === password} />
            </div>
          </div>

          <div>
            <label
              htmlFor={`${formId}-email`}
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Correo electrónico
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id={`${formId}-email`}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${signUpFieldClass} min-w-0 flex-1 ${emailInvalid ? signUpFieldInvalidClass : ""}`}
                placeholder="vos@correo.com"
                aria-invalid={emailInvalid}
              />
              <FieldCheck ok={emailOk} />
            </div>
          </div>

          <div>
            <label
              htmlFor={`${formId}-phone`}
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Número celular
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id={`${formId}-phone`}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${signUpFieldClass} min-w-0 flex-1 ${phoneInvalid ? signUpFieldInvalidClass : ""}`}
                placeholder="Ej. 8888 8888"
                aria-invalid={phoneInvalid}
              />
              <FieldCheck ok={phoneOk} />
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-5 pt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-neon-green py-4 text-center text-base font-bold tracking-tight text-black shadow-[0_0_36px_-6px_rgba(51,255,0,0.55)] transition hover:brightness-110 active:scale-[0.99]"
            >
              {loading ? "Creando cuenta..." : "¡Empezá a comprar y vender!"}
            </button>

            <p className="text-center text-sm text-zinc-500">
              <Link
                href="/login"
                className="text-white/90 underline decoration-violet-electric/50 underline-offset-4 transition hover:text-neon-green hover:decoration-neon-green/60"
              >
                Ya tengo cuenta, Iniciar Sesión
              </Link>
            </p>
          </div>
        </form>
      </div>
    </CyberTropicalShell>
  );
}
