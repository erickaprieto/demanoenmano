const KEY = "vibe:signup_document_setup_token";

export function saveSignupDocumentSetupToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    /* ignore */
  }
}

export function readSignupDocumentSetupToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearSignupDocumentSetupToken(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
