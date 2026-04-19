/**
 * Sanciones de envío van ligadas al user_id global: un baneo por incumplimiento
 * bloquea también comprar (middleware + cookies compartidas).
 */
const STORAGE_KEY = "vibe:legalProfile:v1";

export type LegalProfile = {
  strikes_envio: number;
  is_permanently_banned: boolean;
  /** ISO o null */
  temp_ban_until: string | null;
};

const DEFAULT_PROFILE: LegalProfile = {
  strikes_envio: 0,
  is_permanently_banned: false,
  temp_ban_until: null,
};

export function getLegalProfile(): LegalProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const o = JSON.parse(raw) as Partial<LegalProfile>;
    return {
      strikes_envio:
        typeof o.strikes_envio === "number" && o.strikes_envio >= 0
          ? Math.min(99, Math.floor(o.strikes_envio))
          : 0,
      is_permanently_banned: Boolean(o.is_permanently_banned),
      temp_ban_until:
        typeof o.temp_ban_until === "string" || o.temp_ban_until === null
          ? o.temp_ban_until ?? null
          : null,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

function saveLegalProfile(p: LegalProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent("vibe-legal-profile-updated"));
}

/** Sincroniza cookies de moderación vía API (middleware las lee). */
export async function syncModerationCookiesFromProfile(
  p: LegalProfile,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/account/moderation-cookies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
  } catch {
    /* demo: sin red sigue el estado local */
  }
}

/**
 * Incrementa strikes por incumplimiento de plazo de guía (punto 3).
 * 1–2: baneo temporal 7 días naturales; 3: permanente.
 */
export async function applyShippingStrikeViolation(): Promise<LegalProfile> {
  const prev = getLegalProfile();
  if (prev.is_permanently_banned) return prev;

  const strikes = prev.strikes_envio + 1;
  let is_permanently_banned = false;
  let temp_ban_until: string | null = null;

  if (strikes >= 3) {
    is_permanently_banned = true;
    temp_ban_until = null;
  } else {
    const until = new Date();
    until.setDate(until.getDate() + 7);
    temp_ban_until = until.toISOString();
  }

  const next: LegalProfile = {
    strikes_envio: strikes,
    is_permanently_banned,
    temp_ban_until: is_permanently_banned ? null : temp_ban_until,
  };
  saveLegalProfile(next);
  await syncModerationCookiesFromProfile(next);
  if (typeof window !== "undefined") {
    if (next.is_permanently_banned) {
      window.location.assign("/bienvenida?suspension=perm");
    } else if (strikes > 0 && strikes < 3 && next.temp_ban_until) {
      window.location.assign("/bienvenida?suspension=temp");
    }
  }
  return next;
}

export function markTermsAcceptedLocal(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("vibe:acceptedTerms:v1", "1");
}

export function hasAcceptedTermsLocal(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("vibe:acceptedTerms:v1") === "1";
}
