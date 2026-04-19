"use client";

import { BrandName } from "@/components/branding/BrandName";
import Image from "next/image";
import {
  ChevronRight,
  CircleHelp,
  Package,
  Settings,
  Star,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ComprasClient } from "@/components/perfil/ComprasClient";
import { VentasClient } from "@/components/perfil/VentasClient";
import { hasDeliveryProfile } from "@/lib/deliveryProfile";
import { formatColones } from "@/lib/formatColones";

const DEMO_HANDLE = "@demanoenmano_user";
const DEMO_SALDO = 128_450;

const menuItems = [
  {
    href: "/perfil/resenas",
    label: "Reseñas",
    description: "Ver lo que dicen otros de mí",
    icon: Star,
  },
  {
    href: "/perfil/ajustes",
    label: "Ajustes y privacidad",
    description: "",
    icon: Settings,
  },
  {
    href: "/perfil/ayuda",
    label: "Ayuda y soporte",
    description: "",
    icon: CircleHelp,
  },
] as const;

function initialFromHandle(handle: string): string {
  const u = handle.replace(/^@/, "").trim();
  return u ? u.charAt(0).toUpperCase() : "V";
}

export function ProfileScreen() {
  const formId = useId();
  const [hubTab, setHubTab] = useState<"compras" | "ventas">("compras");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [sinpePhone, setSinpePhone] = useState("");
  const [sinpeHolder, setSinpeHolder] = useState("");
  const [sinpeAmount, setSinpeAmount] = useState("");
  const [withdrawDone, setWithdrawDone] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [envioListo, setEnvioListo] = useState(() =>
    typeof window === "undefined" ? false : hasDeliveryProfile(),
  );
  const [accountName, setAccountName] = useState("Tu cuenta");
  const [accountEmail, setAccountEmail] = useState("");

  const revoke = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    return () => revoke(avatarUrl);
  }, [avatarUrl, revoke]);

  useEffect(() => {
    const sync = () => setEnvioListo(hasDeliveryProfile());
    window.addEventListener("vibe-delivery-profile-updated", sync);
    return () =>
      window.removeEventListener("vibe-delivery-profile-updated", sync);
  }, []);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { authenticated?: boolean; user?: { fullName?: string; email?: string } }) => {
        if (!d?.authenticated || !d.user) return;
        if (typeof d.user.fullName === "string" && d.user.fullName.trim()) {
          setAccountName(d.user.fullName.trim());
        }
        if (typeof d.user.email === "string") setAccountEmail(d.user.email);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!withdrawOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWithdrawOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [withdrawOpen]);

  const onAvatarPick = (f: File | null) => {
    if (!f || !f.type.startsWith("image/")) return;
    setAvatarUrl((prev) => {
      revoke(prev);
      return URL.createObjectURL(f);
    });
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    const amt = Number(sinpeAmount.replace(/\D/g, ""));
    if (!Number.isFinite(amt) || amt < 1) {
      setWithdrawError("Ingresá un monto válido.");
      return;
    }
    if (amt > DEMO_SALDO) {
      setWithdrawError("El monto no puede superar tu saldo disponible.");
      return;
    }
    setWithdrawDone(true);
  };

  const letter = initialFromHandle(DEMO_HANDLE);

  return (
    <div className="px-4 pb-28 pt-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div className="flex flex-wrap items-start gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            id={`${formId}-avatar`}
            onChange={(e) => {
              onAvatarPick(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <label
            htmlFor={`${formId}-avatar`}
            className="relative flex size-[4.5rem] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-electric to-violet-900 text-xl font-bold text-white ring-2 ring-white/15 transition hover:ring-violet-electric/50"
            title="Cambiar foto de perfil"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              letter
            )}
          </label>
          <span className="mt-1 inline-flex items-center rounded-full border border-neon-green/40 bg-neon-green/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neon-green">
            Vendedor verificado
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {accountName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{accountEmail || DEMO_HANDLE}</p>
          <button
            type="button"
            onClick={() => {
              void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
                window.location.assign("/login");
              });
            }}
            className="mt-2 text-xs font-semibold text-red-300 underline-offset-2 transition hover:text-red-200 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {!envioListo ? (
        <div className="mt-6 rounded-2xl border border-violet-electric/30 bg-violet-electric/10 p-4 text-sm text-violet-100">
          <p className="font-semibold text-white">Datos de envío pendientes</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-300">
            Completá tu ficha de entrega (una vez) antes de tu primera compra o
            para recibir paquetes con Correos. Queda asociada a tu cuenta y no se
            comparte en el chat.
          </p>
          <Link
            href="/perfil/datos-envio"
            className="mt-3 inline-flex rounded-xl bg-violet-electric px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Completar datos de envío
          </Link>
        </div>
      ) : null}

      <section
        className="mt-8 rounded-2xl border border-white/[0.06] p-4 ring-1 ring-white/[0.04]"
        style={{ backgroundColor: "#262626" }}
        aria-labelledby={`${formId}-wallet-title`}
      >
        <p
          id={`${formId}-wallet-title`}
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500"
        >
          Saldo <BrandName />
        </p>
        <p className="mt-2 font-mono text-3xl font-bold tabular-nums tracking-tight text-neon-green sm:text-4xl">
          ₡{formatColones(DEMO_SALDO)}
        </p>
        <button
          type="button"
          onClick={() => {
            setWithdrawDone(false);
            setWithdrawError(null);
            setWithdrawOpen(true);
          }}
          className="mt-5 w-full rounded-xl bg-violet-electric py-3 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(138,43,226,0.55)] transition hover:brightness-110 active:scale-[0.99]"
        >
          Retirar fondos
        </button>
      </section>

      <section className="mt-8" aria-labelledby={`${formId}-hub-title`}>
        <h2
          id={`${formId}-hub-title`}
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500"
        >
          Mis pedidos
        </h2>
        <p className="mt-1 text-xs text-zinc-600">
          Un solo perfil para comprar y vender. Las sanciones por envío aplican a
          toda la cuenta.
        </p>
        <div
          className="mt-4 flex rounded-xl border border-white/[0.06] bg-[#262626] p-1 ring-1 ring-white/[0.04]"
          role="tablist"
          aria-label="Compras y ventas"
        >
          <button
            type="button"
            role="tab"
            aria-selected={hubTab === "compras"}
            onClick={() => setHubTab("compras")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
              hubTab === "compras"
                ? "bg-violet-electric/25 text-white shadow-inner ring-1 ring-violet-electric/20"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Package className="size-4" strokeWidth={1.75} aria-hidden />
            Mis Compras
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={hubTab === "ventas"}
            onClick={() => setHubTab("ventas")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
              hubTab === "ventas"
                ? "bg-violet-electric/25 text-white shadow-inner ring-1 ring-violet-electric/20"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Tag className="size-4" strokeWidth={1.75} aria-hidden />
            Mis Ventas
          </button>
        </div>
        <div
          className="mt-4 rounded-2xl border border-white/[0.06] bg-obsidian-elevated/40 p-3 ring-1 ring-white/[0.04]"
          role="tabpanel"
        >
          {hubTab === "compras" ? (
            <ComprasClient embedded />
          ) : (
            <VentasClient embedded />
          )}
        </div>
      </section>

      <nav className="mt-8" aria-label="Opciones de perfil">
        <ul
          className="overflow-hidden rounded-2xl border border-white/[0.06] ring-1 ring-white/[0.04]"
          style={{ backgroundColor: "#262626" }}
        >
          {menuItems.map(({ href, label, description, icon: Icon }, idx) => (
            <li
              key={href}
              className={
                idx > 0 ? "border-t border-white/[0.07]" : ""
              }
            >
              <Link
                href={href}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-white/[0.04]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-violet-electric">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">
                    {label}
                  </span>
                  {description ? (
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {description}
                    </span>
                  ) : null}
                </span>
                <ChevronRight
                  className="size-5 shrink-0 text-zinc-600"
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {withdrawOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="presentation"
          onClick={() => setWithdrawOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${formId}-withdraw-title`}
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-obsidian p-5 shadow-2xl ring-1 ring-white/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2
                id={`${formId}-withdraw-title`}
                className="text-lg font-semibold text-white"
              >
                Retiro por SINPE Móvil
              </h2>
              <button
                type="button"
                onClick={() => setWithdrawOpen(false)}
                className="rounded-full p-1 text-zinc-500 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Los retiros se procesan en menos de 24 horas.
            </p>

            {withdrawDone ? (
              <p
                className="mt-6 rounded-xl border border-neon-green/30 bg-neon-green/10 px-3 py-3 text-center text-sm text-neon-green"
                role="status"
              >
                Solicitud registrada (demo). En producción validaríamos el monto
                y tu identidad.
              </p>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleWithdrawSubmit}>
                {withdrawError ? (
                  <p className="text-xs text-red-400" role="alert">
                    {withdrawError}
                  </p>
                ) : null}
                <div>
                  <label
                    htmlFor={`${formId}-sinpe-phone`}
                    className="text-xs font-medium text-zinc-400"
                  >
                    Número de teléfono para SINPE
                  </label>
                  <input
                    id={`${formId}-sinpe-phone`}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={sinpePhone}
                    onChange={(e) => setSinpePhone(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-electric/60 focus:ring-1 focus:ring-violet-electric/35"
                    placeholder="8888-8888"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`${formId}-sinpe-holder`}
                    className="text-xs font-medium text-zinc-400"
                  >
                    Nombre del titular
                  </label>
                  <input
                    id={`${formId}-sinpe-holder`}
                    type="text"
                    autoComplete="name"
                    value={sinpeHolder}
                    onChange={(e) => setSinpeHolder(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-electric/60 focus:ring-1 focus:ring-violet-electric/35"
                    placeholder="Como figura en el SINPE"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`${formId}-sinpe-amount`}
                    className="text-xs font-medium text-zinc-400"
                  >
                    Monto a retirar (₡)
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                      ₡
                    </span>
                    <input
                      id={`${formId}-sinpe-amount`}
                      type="text"
                      inputMode="numeric"
                      value={sinpeAmount}
                      onChange={(e) =>
                        setSinpeAmount(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] py-2.5 pl-9 pr-3.5 font-mono text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-electric/60 focus:ring-1 focus:ring-violet-electric/35"
                      placeholder="Monto"
                      required
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-600">
                    Saldo disponible: ₡{formatColones(DEMO_SALDO)} (demo).
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-violet-electric py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Solicitar retiro
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setWithdrawOpen(false)}
              className="mt-4 w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05]"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
