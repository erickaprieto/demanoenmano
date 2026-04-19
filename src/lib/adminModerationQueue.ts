const KEY = "vibe:adminModerationQueue:v1";

export type AdminModerationAlert = {
  id: string;
  createdAt: number;
  severity: "standard" | "critical";
  chatLogUrl: string;
  reportedId: string;
  reporterId: string;
  reason: string;
  contextChatId: string | null;
  autoScanHitCount: number;
};

export function pushAdminModerationAlert(
  entry: Omit<AdminModerationAlert, "id" | "createdAt">,
): AdminModerationAlert {
  if (typeof window === "undefined") {
    return {
      id: "ssr",
      createdAt: 0,
      ...entry,
    };
  }
  const row: AdminModerationAlert = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `adm-${Date.now()}`,
    createdAt: Date.now(),
    ...entry,
  };
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as AdminModerationAlert[]) : [];
    list.unshift(row);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
    window.dispatchEvent(new CustomEvent("vibe-admin-moderation-updated"));
  } catch {
    /* ignore */
  }
  return row;
}

export function listAdminModerationAlerts(): AdminModerationAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as AdminModerationAlert[]) : [];
    return Array.isArray(list)
      ? [...list].sort((a, b) => b.createdAt - a.createdAt)
      : [];
  } catch {
    return [];
  }
}
