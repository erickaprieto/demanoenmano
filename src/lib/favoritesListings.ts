const STORAGE_KEY = "vibe:favoriteListings:v1";

export function getFavoriteListingIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string" && v.length > 0);
  } catch {
    return [];
  }
}

export function saveFavoriteListingIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
  window.dispatchEvent(new Event("vibe-favorites-updated"));
}

export function addFavoriteListingId(listingId: string): void {
  const id = listingId.trim();
  if (!id) return;
  const prev = getFavoriteListingIds();
  if (prev.includes(id)) return;
  saveFavoriteListingIds([...prev, id]);
}
