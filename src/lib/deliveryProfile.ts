const STORAGE_KEY = "vibe:deliveryProfile:v1";

export type DeliveryProfileV1 = {
  version: 1;
  updatedAt: string;
  fullName: string;
  phone: string;
  province: string;
  canton: string;
  district: string;
  addressReference: string;
};

export function hasDeliveryProfile(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as DeliveryProfileV1;
    return (
      p?.version === 1 &&
      Boolean(p.fullName?.trim()) &&
      Boolean(p.phone?.trim()) &&
      Boolean(p.province?.trim()) &&
      Boolean(p.canton?.trim()) &&
      Boolean(p.addressReference?.trim())
    );
  } catch {
    return false;
  }
}

export function loadDeliveryProfile(): DeliveryProfileV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as DeliveryProfileV1;
    return p?.version === 1 ? p : null;
  } catch {
    return null;
  }
}

export function saveDeliveryProfile(profile: DeliveryProfileV1): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("vibe-delivery-profile-updated"));
}
