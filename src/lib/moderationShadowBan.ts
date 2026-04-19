/**
 * Shadow ban local + mapeo demo usuario chat → sellers en el feed.
 * En producción, el flag vive en Supabase/Postgres y el feed filtra en servidor.
 */

import { getOrCreateDemoUserId } from "./demoUserId";

const HIDDEN_SELLERS_KEY = "vibe:feedHiddenSellerIds:v1";
const BC_NAME = "vibe-moderation-v1";

/** Usuario reportado (id de chat demo) → sellerUserId en swipeProducts */
export const REPORTED_USER_TO_SELLER_IDS: Record<string, readonly string[]> = {
  usr_maria_g: ["seller_ch_001"],
  usr_vintage_cr: ["seller_ch_002"],
};

export function readHiddenSellerIdsFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HIDDEN_SELLERS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list)
      ? list.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function writeHiddenSellerIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  const unique = [...new Set(ids)];
  localStorage.setItem(HIDDEN_SELLERS_KEY, JSON.stringify(unique));
}

function collectSellerIdsToHide(reportedUserId: string): string[] {
  const mapped = REPORTED_USER_TO_SELLER_IDS[reportedUserId];
  if (mapped?.length) return [...mapped];
  if (reportedUserId.startsWith("seller_")) return [reportedUserId];
  return [];
}

/** Oculta listados del feed y notifica otras pestañas (demo). */
export function applyClientShadowBanForReportedUser(
  reportedUserId: string,
): void {
  if (typeof window === "undefined") return;
  const existing = readHiddenSellerIdsFromStorage();
  const add = collectSellerIdsToHide(reportedUserId);
  writeHiddenSellerIds([...existing, ...add]);
  window.dispatchEvent(
    new CustomEvent("vibe-shadow-ban-updated", {
      detail: { reportedUserId, hiddenSellerIds: add },
    }),
  );
  try {
    const bc = new BroadcastChannel(BC_NAME);
    bc.postMessage({
      type: "shadow_ban",
      reportedUserId,
      hiddenSellerIds: add,
    });
    setTimeout(() => bc.close(), 250);
  } catch {
    /* ignore */
  }
}

/** Otras pestañas reciben los mismos seller ids a ocultar (localStorage compartido + merge). */
export function mergeHiddenSellerIdsFromBroadcast(hiddenSellerIds: string[]): void {
  if (typeof window === "undefined" || hiddenSellerIds.length === 0) return;
  const existing = readHiddenSellerIdsFromStorage();
  writeHiddenSellerIds([...existing, ...hiddenSellerIds]);
  window.dispatchEvent(
    new CustomEvent("vibe-shadow-ban-updated", {
      detail: { hiddenSellerIds },
    }),
  );
}

const ACCOUNT_REVIEW_KEY = "vibe:accountUnderReview:v1";
const REVIEW_MESSAGE =
  "Tu cuenta está bajo revisión por intentar violar las políticas de seguridad de De Mano en Mano.";

export function readAccountReviewMessage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_REVIEW_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { message?: string };
    return typeof o?.message === "string" ? o.message : REVIEW_MESSAGE;
  } catch {
    return REVIEW_MESSAGE;
  }
}

export function clearAccountReviewLock(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCOUNT_REVIEW_KEY);
  window.dispatchEvent(new CustomEvent("vibe-account-review-cleared"));
}

/** Si el infractor coincide con esta sesión demo, bloquea la app con el mensaje oficial. */
function setAccountReviewLockLocal(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    ACCOUNT_REVIEW_KEY,
    JSON.stringify({ message: REVIEW_MESSAGE, at: Date.now() }),
  );
  window.dispatchEvent(new CustomEvent("vibe-account-under-review"));
}

/** Llamar en la pestaña del infractor cuando coincide con `reportedUserId` (BroadcastChannel). */
export function applyAccountReviewLockIfSelf(reportedUserId: string): void {
  if (typeof window === "undefined") return;
  if (getOrCreateDemoUserId() !== reportedUserId) return;
  setAccountReviewLockLocal();
}

/** Tras un ban crítico, notificar a todas las pestañas; solo el infractor aplica el lock. */
export function broadcastCriticalAccountReview(reportedUserId: string): void {
  if (typeof window === "undefined") return;
  try {
    const bc = new BroadcastChannel(BC_NAME);
    bc.postMessage({
      type: "account_under_review",
      reportedUserId,
      message: REVIEW_MESSAGE,
    });
    setTimeout(() => bc.close(), 250);
  } catch {
    /* ignore */
  }
  applyAccountReviewLockIfSelf(reportedUserId);
}

export { REVIEW_MESSAGE };
