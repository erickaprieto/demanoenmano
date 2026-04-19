"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  loadDeliveryProfile,
  saveDeliveryProfile,
  type DeliveryProfileV1,
} from "@/lib/deliveryProfile";
import { syncShippingFromDeliveryProfile } from "@/lib/vibeProfile";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-electric/60 focus:ring-1 focus:ring-violet-electric/35";

type DeliveryProfileFormProps = {
  /** Si true, muestra enlace para volver al checkout */
  returnToCheckout?: boolean;
};

export function DeliveryProfileForm({ returnToCheckout }: DeliveryProfileFormProps) {
  const formId = useId();
  const initial = useMemo(() => loadDeliveryProfile(), []);

  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [canton, setCanton] = useState(initial?.canton ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [addressReference, setAddressReference] = useState(
    initial?.addressReference ?? "",
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !province.trim() ||
      !canton.trim() ||
      !addressReference.trim()
    ) {
      setError("Completá los campos obligatorios.");
      return;
    }
    const profile: DeliveryProfileV1 = {
      version: 1,
      updatedAt: new Date().toISOString(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      province: province.trim(),
      canton: canton.trim(),
      district: district.trim(),
      addressReference: addressReference.trim(),
    };
    saveDeliveryProfile(profile);
    syncShippingFromDeliveryProfile(profile);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-electric/25 bg-violet-electric/10 p-4 text-sm leading-relaxed text-violet-100">
        <p className="font-semibold text-white">Por qué pedimos estos datos</p>
        <p className="mt-2 text-xs text-zinc-300">
          Los usamos solo para generar etiquetas y avisos de{" "}
          <span className="text-white">Correos de Costa Rica</span>.{" "}
          <span className="font-medium text-white">
            No se comparten en el chat
          </span>{" "}
          con el vendedor ni el comprador: cada quien ve solo la guía y el
          estado del envío dentro de De Mano en Mano.
        </p>
      </div>

      {saved ? (
        <p
          className="rounded-xl border border-neon-green/30 bg-neon-green/10 px-3 py-3 text-center text-sm text-neon-green"
          role="status"
        >
          Datos guardados. Ya podés comprar o recibir envíos con esta cuenta
          (demo).
        </p>
      ) : null}

      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor={`${formId}-name`} className="text-xs font-medium text-zinc-400">
            Nombre completo (destinatario Correos) *
          </label>
          <input
            id={`${formId}-name`}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={`${inputClass} mt-1.5`}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label htmlFor={`${formId}-phone`} className="text-xs font-medium text-zinc-400">
            Teléfono (avisos Correos / SINPE) *
          </label>
          <input
            id={`${formId}-phone`}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`${inputClass} mt-1.5`}
            autoComplete="tel"
            required
          />
          <p className="mt-1 text-[10px] text-zinc-600">
            No aparece en el chat. Solo operaciones logísticas en De Mano en Mano.
          </p>
        </div>
        <div>
          <label htmlFor={`${formId}-prov`} className="text-xs font-medium text-zinc-400">
            Provincia *
          </label>
          <input
            id={`${formId}-prov`}
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className={`${inputClass} mt-1.5`}
            placeholder="Ej. San José"
            required
          />
        </div>
        <div>
          <label htmlFor={`${formId}-can`} className="text-xs font-medium text-zinc-400">
            Cantón *
          </label>
          <input
            id={`${formId}-can`}
            value={canton}
            onChange={(e) => setCanton(e.target.value)}
            className={`${inputClass} mt-1.5`}
            required
          />
        </div>
        <div>
          <label htmlFor={`${formId}-dist`} className="text-xs font-medium text-zinc-400">
            Distrito
          </label>
          <input
            id={`${formId}-dist`}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div>
          <label htmlFor={`${formId}-addr`} className="text-xs font-medium text-zinc-400">
            Indicaciones de entrega *
          </label>
          <textarea
            id={`${formId}-addr`}
            value={addressReference}
            onChange={(e) => setAddressReference(e.target.value)}
            rows={3}
            className={`${inputClass} mt-1.5 resize-none`}
            placeholder="Referencias para el cartero (sin compartir contacto en chat)"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-2xl bg-violet-electric py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(138,43,226,0.5)] transition hover:brightness-110"
        >
          Guardar datos de envío
        </button>
      </form>

      {returnToCheckout ? (
        <Link
          href="/checkout"
          className="block text-center text-sm font-medium text-violet-300 underline-offset-2 hover:underline"
        >
          Volver al checkout
        </Link>
      ) : null}
    </div>
  );
}
