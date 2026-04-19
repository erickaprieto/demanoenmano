const STORAGE_KEY = "vibe:photoTipsDismissed:v1";

export function readPhotoTipsPermanentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePhotoTipsPermanentlyDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}
