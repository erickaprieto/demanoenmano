const STORAGE_KEY = "vibe:demoUserId:v1";

export function getOrCreateDemoUserId(): string {
  if (typeof window === "undefined") return "ssr-anon";
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing?.trim()) return existing.trim();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `user-${Date.now()}`;
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return `user-${Date.now()}`;
  }
}
