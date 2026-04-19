"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import {
  CANTONES_BY_PROVINCIA,
  DISTRITOS_BY_CANTON,
  PROVINCIAS_CR,
} from "@/data/costaRicaUbicacionDemo";
import { loadSignupDraft } from "@/lib/signupDraft";
import {
  saveDeliveryProfile,
  type DeliveryProfileV1,
} from "@/lib/deliveryProfile";
import { syncShippingFromDeliveryProfile } from "@/lib/vibeProfile";
import { CyberTropicalShell } from "./CyberTropicalShell";
import {
  selectChevronStyle,
  signUpFieldClass,
  signUpFieldInvalidClass,
  signUpSelectClass,
} from "./signUpFieldStyles";

const ID_TIPOS = [
  { value: "nacional", label: "Cédula nacional" },
  { value: "dimex", label: "DIMEX" },
  { value: "pasaporte", label: "Pasaporte" },
] as const;

function validId(tipo: string, num: string): boolean {
  const n = num.replace(/\s/g, "");
  if (!n) return false;
  if (tipo === "nacional") return /^\d{9,12}$/.test(n);
  if (tipo === "dimex") return n.length >= 10;
  return n.length >= 6;
}

const CEDULA_STORAGE = "vibe:cedulaEnvio:v1";

export function CorreosShippingScreen() {
  const formId = useId();
  const router = useRouter();
  const [idTipo, setIdTipo] = useState<string>("nacional");
  const [idNumero, setIdNumero] = useState("");
  const [provinciaId, setProvinciaId] = useState("");
  const [cantonId, setCantonId] = useState("");
  const [distritoId, setDistritoId] = useState("");
  const [direccion, setDireccion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (!loadSignupDraft()) {
      router.replace("/registro");
    }
  }, [router]);

  const cantones = useMemo(
    () => (provinciaId ? CANTONES_BY_PROVINCIA[provinciaId] ?? [] : []),
    [provinciaId],
  );
  const distritos = useMemo(
    () => (cantonId ? DISTRITOS_BY_CANTON[cantonId] ?? [] : []),
    [cantonId],
  );

  const idOk = useMemo(() => validId(idTipo, idNumero), [idTipo, idNumero]);
  const direccionOk = direccion.trim().length >= 8;
  const cedulaInvalid = idNumero.length > 0 && !idOk;
  const provinciaInvalid = attemptedSubmit && !provinciaId;
  const cantonInvalid = attemptedSubmit && !cantonId;
  const distritoInvalid = attemptedSubmit && !distritoId;
  const direccionInvalid = (attemptedSubmit || direccion.length > 0) && !direccionOk;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAttemptedSubmit(true);
    const draft = loadSignupDraft();
    if (!draft?.fullName?.trim() || !draft.phone?.trim()) {
      setError("Falta el registro inicial. Volvé a «Registro» para cargar tus datos.");
      return;
    }
    if (!idOk) {
      setError("Revisá el tipo y número de identificación.");
      return;
    }
    if (!provinciaId || !cantonId || !distritoId || !direccionOk) {
      setError("Completá provincia, cantón, distrito y dirección exacta.");
      return;
    }

    const provLabel = PROVINCIAS_CR.find((p) => p.id === provinciaId)?.label ?? "";
    const cantLabel = cantones.find((c) => c.id === cantonId)?.label ?? "";
    const distLabel = distritos.find((d) => d.id === distritoId)?.label ?? "";

    const profile: DeliveryProfileV1 = {
      version: 1,
      updatedAt: new Date().toISOString(),
      fullName: draft.fullName.trim(),
      phone: draft.phone.trim(),
      province: provLabel,
      canton: cantLabel,
      district: distLabel,
      addressReference: direccion.trim(),
    };
    saveDeliveryProfile(profile);
    syncShippingFromDeliveryProfile(profile);
    try {
      localStorage.setItem(
        CEDULA_STORAGE,
        JSON.stringify({
          tipo: idTipo,
          numero: idNumero.replace(/\s/g, "").trim(),
        }),
      );
    } catch {
      /* ignore */
    }
    setDone(true);
  };

  if (done) {
    return (
      <CyberTropicalShell>
        <div className="flex flex-1 flex-col justify-center py-12 text-center">
          <CircleCheck
            className="mx-auto size-14 text-neon-green drop-shadow-[0_0_20px_rgba(51,255,0,0.45)]"
            strokeWidth={1.5}
            aria-hidden
          />
          <h2 className="mt-6 text-xl font-semibold text-white">
            Datos listos para Correos
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            Guardamos tu dirección en este dispositivo (demo). Continuá a términos o
            al inicio cuando quieras.
          </p>
          <Link
            href="/bienvenida"
            className="mt-10 inline-flex w-full items-center justify-center rounded-2xl bg-violet-electric py-3.5 text-sm font-semibold text-white shadow-[0_0_28px_-6px_rgba(138,43,226,0.55)] transition hover:brightness-110"
          >
            Ir a bienvenida
          </Link>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-3 w-full rounded-2xl border border-white/10 py-3 text-sm font-medium text-zinc-300 transition hover:border-violet-electric/40 hover:text-white"
          >
            Ir al inicio
          </button>
        </div>
      </CyberTropicalShell>
    );
  }

  return (
    <CyberTropicalShell>
      <div className="flex flex-1 flex-col pb-4">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-electric/90">
          Paso 2
        </p>
        <h1 className="mt-2 text-center text-xl font-semibold leading-snug tracking-tight text-white">
          Datos para tu Envío
          <span className="mt-1 block text-sm font-normal text-zinc-500">
            (Correos de Costa Rica)
          </span>
        </h1>

        <form className="mt-8 flex flex-1 flex-col gap-5" onSubmit={submit} noValidate>
          {error ? (
            <p className="text-center text-xs text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Cédula de identidad (tipo / número)
            </p>
            <div className="mt-1.5 grid grid-cols-[minmax(0,38%)_1fr] gap-2">
              <select
                id={`${formId}-idtipo`}
                value={idTipo}
                onChange={(e) => setIdTipo(e.target.value)}
                className={signUpSelectClass}
                style={selectChevronStyle}
              >
                {ID_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <input
                  id={`${formId}-idnum`}
                  value={idNumero}
                  onChange={(e) => setIdNumero(e.target.value)}
                  className={`${signUpFieldClass} min-w-0 flex-1 ${cedulaInvalid ? signUpFieldInvalidClass : ""}`}
                  placeholder="Número sin espacios"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={cedulaInvalid}
                />
                {idOk ? (
                  <CircleCheck
                    className="size-5 shrink-0 text-neon-green drop-shadow-[0_0_10px_rgba(51,255,0,0.55)]"
                    strokeWidth={2}
                    aria-label="Identificación válida"
                  />
                ) : (
                  <span className="size-5 shrink-0" aria-hidden />
                )}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor={`${formId}-prov`}
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Provincia
            </label>
            <select
              id={`${formId}-prov`}
              value={provinciaId}
              onChange={(e) => {
                setProvinciaId(e.target.value);
                setCantonId("");
                setDistritoId("");
              }}
              className={`${signUpSelectClass} mt-1.5 ${provinciaInvalid ? signUpFieldInvalidClass : ""}`}
              aria-invalid={provinciaInvalid}
              style={selectChevronStyle}
              required
            >
              <option value="">Seleccioná provincia</option>
              {PROVINCIAS_CR.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${formId}-can`}
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Cantón
            </label>
            <select
              id={`${formId}-can`}
              value={cantonId}
              onChange={(e) => {
                setCantonId(e.target.value);
                setDistritoId("");
              }}
              disabled={!provinciaId}
              className={`${signUpSelectClass} mt-1.5 disabled:cursor-not-allowed disabled:opacity-40 ${cantonInvalid ? signUpFieldInvalidClass : ""}`}
              style={selectChevronStyle}
              aria-invalid={cantonInvalid}
              required
            >
              <option value="">
                {provinciaId ? "Seleccioná cantón" : "Elegí provincia primero"}
              </option>
              {cantones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${formId}-dist`}
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Distrito
            </label>
            <select
              id={`${formId}-dist`}
              value={distritoId}
              onChange={(e) => setDistritoId(e.target.value)}
              disabled={!cantonId}
              className={`${signUpSelectClass} mt-1.5 disabled:cursor-not-allowed disabled:opacity-40 ${distritoInvalid ? signUpFieldInvalidClass : ""}`}
              style={selectChevronStyle}
              aria-invalid={distritoInvalid}
              required
            >
              <option value="">
                {cantonId ? "Seleccioná distrito" : "Elegí cantón primero"}
              </option>
              {distritos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label
              htmlFor={`${formId}-addr`}
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Dirección exacta (señas)
            </label>
            <textarea
              id={`${formId}-addr`}
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              rows={5}
              className={`${signUpFieldClass} mt-1.5 min-h-[140px] resize-none leading-relaxed ${direccionInvalid ? signUpFieldInvalidClass : ""}`}
              placeholder="De frente al parque, portón negro, torre B, apartamento 4…"
              aria-invalid={direccionInvalid}
              required
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              className="w-full rounded-2xl bg-neon-green py-3.5 text-sm font-bold text-black shadow-[0_0_32px_-6px_rgba(51,255,0,0.5)] transition hover:brightness-110 active:scale-[0.99]"
            >
              Guardar y continuar
            </button>
            <Link
              href="/registro"
              className="text-center text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
            >
              Volver al registro
            </Link>
          </div>
        </form>
      </div>
    </CyberTropicalShell>
  );
}
