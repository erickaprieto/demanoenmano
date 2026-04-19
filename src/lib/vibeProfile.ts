/**
 * Perfil dual (comprador + vendedor) — un solo user_id (app De Mano en Mano).
 * Demo: localStorage; producción: tabla `profiles` en Supabase.
 */

import { getOrCreateDemoUserId } from "@/lib/demoUserId";
import type { DeliveryProfileV1 } from "@/lib/deliveryProfile";

const STORAGE_KEY = "vibe:dualProfile:v1";

export type CorreosShippingAddress = {
  provincia: string;
  canton: string;
  distrito: string;
  codigo_postal: string;
  direccion_exacta: string;
};

export type VibeDualProfileV1 = {
  version: 1;
  id: string;
  email: string;
  phone: string;
  phone_verified: boolean;
  full_name: string;
  cedula: string;
  iban_account: string;
  identity_photo_url: string;
  is_verified_seller: boolean;
  shipping_address: CorreosShippingAddress | null;
};

const emptyProfile = (id: string): VibeDualProfileV1 => ({
  version: 1,
  id,
  email: "",
  phone: "",
  phone_verified: false,
  full_name: "",
  cedula: "",
  iban_account: "",
  identity_photo_url: "",
  is_verified_seller: false,
  shipping_address: null,
});

export function loadVibeDualProfile(): VibeDualProfileV1 {
  if (typeof window === "undefined") {
    return emptyProfile("ssr");
  }
  const id = getOrCreateDemoUserId();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile(id);
    const o = JSON.parse(raw) as Partial<VibeDualProfileV1>;
    if (o?.version !== 1) return emptyProfile(id);
    const base = emptyProfile(id);
    return {
      ...base,
      ...o,
      id,
      shipping_address:
        o.shipping_address &&
        typeof o.shipping_address === "object" &&
        typeof (o.shipping_address as CorreosShippingAddress).provincia ===
          "string"
          ? (o.shipping_address as CorreosShippingAddress)
          : null,
    };
  } catch {
    return emptyProfile(id);
  }
}

export function saveVibeDualProfile(p: VibeDualProfileV1): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...p, id: p.id }));
  window.dispatchEvent(new CustomEvent("vibe-dual-profile-updated"));
}

/** Marca demo cuando la foto ya no se guarda como blob (persistencia local). */
export const KYC_PHOTO_ON_FILE_PLACEHOLDER = "vibe:kyc-photo-on-file:v1";

/**
 * KYC vendedor: una sola vez por cuenta. Tras `is_verified_seller` + cédula + IBAN
 * no volvemos a bloquear publicar (en producción la foto viviría en storage).
 */
export function hasSellerKycComplete(p: VibeDualProfileV1): boolean {
  return (
    p.is_verified_seller === true &&
    Boolean(p.cedula?.trim()) &&
    Boolean(p.iban_account?.trim())
  );
}

export function hasBuyerShippingComplete(p: VibeDualProfileV1): boolean {
  const s = p.shipping_address;
  if (!s) return false;
  return (
    Boolean(s.provincia?.trim()) &&
    Boolean(s.canton?.trim()) &&
    Boolean(s.direccion_exacta?.trim())
  );
}

/** Sincroniza shipping_address (JSONB) desde la ficha de envío existente. */
export function syncShippingFromDeliveryProfile(dp: DeliveryProfileV1): void {
  const id = getOrCreateDemoUserId();
  const cur = loadVibeDualProfile();
  const shipping_address: CorreosShippingAddress = {
    provincia: dp.province.trim(),
    canton: dp.canton.trim(),
    distrito: (dp.district ?? "").trim(),
    codigo_postal: "",
    direccion_exacta: dp.addressReference.trim(),
  };
  saveVibeDualProfile({
    ...cur,
    id,
    full_name: dp.fullName.trim() || cur.full_name,
    phone: dp.phone.trim() || cur.phone,
    phone_verified: Boolean(dp.phone.trim()),
    shipping_address,
  });
}

export function applySellerKycDemo(input: {
  cedula: string;
  iban_account: string;
  identity_photo_url: string;
}): void {
  const id = getOrCreateDemoUserId();
  const cur = loadVibeDualProfile();
  const rawPhoto = input.identity_photo_url.trim();
  /** No persistir blob: al recargar dejaría de cumplir KYC; el archivo queda “en custodia” demo. */
  const identity_photo_url =
    rawPhoto.startsWith("blob:") || rawPhoto.startsWith("data:")
      ? KYC_PHOTO_ON_FILE_PLACEHOLDER
      : rawPhoto || KYC_PHOTO_ON_FILE_PLACEHOLDER;
  saveVibeDualProfile({
    ...cur,
    id,
    cedula: input.cedula.trim(),
    iban_account: input.iban_account.trim(),
    identity_photo_url,
    is_verified_seller: true,
  });
}

export function buildBuyerLogisticsSnapshot(): {
  full_name: string;
  phone: string;
  shipping_address: CorreosShippingAddress;
} | null {
  const p = loadVibeDualProfile();
  if (!hasBuyerShippingComplete(p) || !p.shipping_address) return null;
  const name = p.full_name.trim() || "Comprador";
  const phone = p.phone.trim();
  if (!phone) return null;
  return {
    full_name: name,
    phone,
    shipping_address: p.shipping_address,
  };
}

export function formatShippingForCorreosPaste(s: CorreosShippingAddress): string {
  return [
    `Provincia: ${s.provincia}`,
    `Cantón: ${s.canton}`,
    `Distrito: ${s.distrito || "—"}`,
    `Código postal: ${s.codigo_postal || "—"}`,
    `Dirección: ${s.direccion_exacta}`,
  ].join("\n");
}
