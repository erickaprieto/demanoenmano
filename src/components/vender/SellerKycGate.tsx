"use client";

import Image from "next/image";
import { ShieldCheck, Upload } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
};

/**
 * KYC vendedor: se completa una sola vez por cuenta; luego `hasSellerKycComplete` deja pasar al formulario.
 */
export function SellerKycGate({ children }: Props) {
  const formId = useId();
  const [status, setStatus] = useState<
    "loading" | "not_submitted" | "pending" | "approved" | "rejected"
  >("loading");
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [autoChecks, setAutoChecks] = useState<string[]>([]);
  const [cedula, setCedula] = useState("");
  const [iban, setIban] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoMeta, setPhotoMeta] = useState<{
    mime: string;
    size: number;
    width: number;
    height: number;
    dataUrl: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(() => {
    void fetch("/api/seller-verification/me")
      .then((r) => r.json())
      .then(
        (d: {
          status?: "not_submitted" | "pending" | "approved" | "rejected";
          rejectReason?: string | null;
          autoChecks?: string[];
        }) => {
          const s = d?.status;
          if (
            s === "not_submitted" ||
            s === "pending" ||
            s === "approved" ||
            s === "rejected"
          ) {
            setStatus(s);
          } else {
            setStatus("not_submitted");
          }
          setRejectReason(typeof d?.rejectReason === "string" ? d.rejectReason : null);
          setAutoChecks(Array.isArray(d?.autoChecks) ? d.autoChecks : []);
        },
      )
      .catch(() => setStatus("not_submitted"));
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    return () => {
      if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  if (status === "approved") {
    return <>{children}</>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const c = cedula.trim();
    const ib = iban.replace(/\s/g, "").trim();
    if (!c || c.length < 5) {
      setError("Ingresá un número de cédula válido.");
      return;
    }
    if (!ib || ib.length < 8) {
      setError("Ingresá un IBAN válido.");
      return;
    }
    if (!photoMeta) {
      setError("Subí una selfie con cédula válida.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/seller-verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cedula: c,
          iban: ib,
          selfieImageDataUrl: photoMeta.dataUrl,
          selfieMimeType: photoMeta.mime,
          selfieSizeBytes: photoMeta.size,
          selfieWidth: photoMeta.width,
          selfieHeight: photoMeta.height,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: "pending" | "rejected";
        autoChecks?: string[];
      };
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar verificación.");
        return;
      }
      setStatus(data.status === "pending" ? "pending" : "rejected");
      setAutoChecks(Array.isArray(data.autoChecks) ? data.autoChecks : []);
      setRejectReason(
        data.status === "rejected"
          ? "La imagen no cumple validaciones automáticas. Ajustá la foto y volvé a subir."
          : null,
      );
    } catch {
      setError("Error de red al enviar verificación.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-electric/30 bg-violet-electric/[0.07] p-5 ring-1 ring-violet-electric/20">
      <div className="flex gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-electric/20 text-violet-electric">
          <ShieldCheck className="size-6" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">
            Verificación de vendedor (KYC)
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Debés subir selfie con cédula. Tu perfil de vendedor queda{" "}
            <span className="text-zinc-200">pendiente de aprobación admin</span>{" "}
            antes de publicar.
          </p>
          {status === "pending" ? (
            <p className="mt-2 text-xs text-amber-200">
              Estado actual: pendiente de aprobación.
            </p>
          ) : null}
          {status === "rejected" ? (
            <p className="mt-2 text-xs text-red-300">
              Rechazado: {rejectReason ?? "Revisá la imagen y reenviá."}
            </p>
          ) : null}
          {autoChecks.length > 0 ? (
            <p className="mt-1 text-[11px] text-zinc-500">
              Validaciones automáticas: {autoChecks.join(", ")}
            </p>
          ) : null}
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        {error ? (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <label
            htmlFor={`${formId}-cedula`}
            className="text-xs font-medium text-zinc-400"
          >
            Cédula de identidad *
          </label>
          <input
            id={`${formId}-cedula`}
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-electric/50"
            placeholder="0-0000-0000"
            autoComplete="off"
          />
        </div>
        <div>
          <label
            htmlFor={`${formId}-iban`}
            className="text-xs font-medium text-zinc-400"
          >
            IBAN *
          </label>
          <p
            id={`${formId}-iban-hint`}
            className="mt-1 text-[11px] leading-snug text-zinc-500"
          >
            Es la cuenta donde se realizan los pagos de tus ventas; debe ser en{" "}
            <span className="text-zinc-400">colones costarricenses (CRC)</span>.
          </p>
          <input
            id={`${formId}-iban`}
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-violet-electric/50"
            placeholder="CRXX XXXX XXXX XXXX XXXX XXXX"
            autoComplete="off"
            aria-describedby={`${formId}-iban-hint`}
          />
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-400">
            Foto de cédula / selfie con cédula *
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (!f.type.startsWith("image/")) {
                setError("El archivo debe ser una imagen.");
                return;
              }
              if (f.size < 80_000 || f.size > 4_500_000) {
                setError("La imagen debe pesar entre 80KB y 4.5MB.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = String(reader.result ?? "");
                const img = new window.Image();
                img.onload = () => {
                  setPhotoMeta({
                    mime: f.type,
                    size: f.size,
                    width: img.width,
                    height: img.height,
                    dataUrl,
                  });
                  setPhotoUrl((prev) => {
                    if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
                    return URL.createObjectURL(f);
                  });
                  setError(null);
                };
                img.src = dataUrl;
              };
              reader.readAsDataURL(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-obsidian py-8 text-sm text-zinc-400 transition hover:border-violet-electric/40 hover:text-zinc-200"
          >
            <Upload className="size-5" strokeWidth={1.75} />
            {photoUrl ? "Cambiar imagen" : "Subir imagen"}
          </button>
          {photoUrl ? (
            <div className="relative mt-3 h-40 w-full">
              <Image
                src={photoUrl}
                alt="Vista previa documento"
                fill
                unoptimized
                className="rounded-lg object-contain ring-1 ring-white/10"
              />
            </div>
          ) : null}
        </div>
        <button
          type="submit"
            disabled={saving || status === "pending"}
          className="w-full rounded-2xl bg-violet-electric py-3 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(138,43,226,0.5)] transition hover:brightness-110"
        >
            {status === "pending"
              ? "Verificación enviada (pendiente)"
              : saving
                ? "Enviando..."
                : "Enviar verificación para aprobación"}
        </button>
      </form>
    </div>
  );
}
