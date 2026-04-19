const STORAGE_KEY = "vibe:signupDraft:v1";

export type SignupDraftV1 = {
  version: 1;
  fullName: string;
  email: string;
  phone: string;
};

export function saveSignupDraft(draft: Omit<SignupDraftV1, "version">): void {
  if (typeof window === "undefined") return;
  const payload: SignupDraftV1 = {
    version: 1,
    ...draft,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadSignupDraft(): SignupDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<SignupDraftV1>;
    if (o.version !== 1) return null;
    return {
      version: 1,
      fullName: String(o.fullName ?? ""),
      email: String(o.email ?? ""),
      phone: String(o.phone ?? ""),
    };
  } catch {
    return null;
  }
}
