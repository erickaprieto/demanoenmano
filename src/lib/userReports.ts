import { getOrCreateDemoUserId } from "./demoUserId";

const STORAGE_KEY = "vibe:userReportsLocal:v1";

export type UserReportReason =
  | "negotiate_outside"
  | "contact_leak"
  | "wrong_category"
  | "abuse_scam";

export type UserReportSeverity = "standard" | "critical";

export type UserReportPayload = {
  reporter_id: string;
  reported_id: string;
  reason: UserReportReason;
  comments: string;
  context_chat_id: string | null;
  /** Escaneo automático del chat (moderación). */
  severity?: UserReportSeverity;
  auto_scan_hit_count?: number;
  /** Texto breve para revisión admin (reportes desde chat). */
  chat_snippet?: string | null;
  /** JSON serializado: líneas { from, body, at } — solo para panel admin. */
  chat_snapshot_json?: string | null;
};

export const USER_REPORT_REASON_LABELS: Record<
  UserReportReason,
  { short: string; detail: string }
> = {
  negotiate_outside: {
    short: "Negociación por fuera",
    detail: "Intentó negociar por fuera.",
  },
  contact_leak: {
    short: "Datos de contacto",
    detail: "Intentó pasar datos de contacto.",
  },
  wrong_category: {
    short: "Categoría incorrecta",
    detail: "Producto no coincide con la categoría.",
  },
  abuse_scam: {
    short: "Lenguaje / estafa",
    detail: "Lenguaje inapropiado / Estafa.",
  },
};

function appendLocal(payload: UserReportPayload): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as UserReportPayload[]) : [];
    list.push({
      ...payload,
      comments: payload.comments.trim(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export async function submitUserReport(
  payload: Omit<UserReportPayload, "reporter_id"> & { reporter_id?: string },
): Promise<{ ok: boolean }> {
  const reporter_id = payload.reporter_id ?? getOrCreateDemoUserId();
  const full: UserReportPayload = {
    reporter_id,
    reported_id: payload.reported_id,
    reason: payload.reason,
    comments: payload.comments.trim(),
    context_chat_id: payload.context_chat_id,
    severity: payload.severity ?? "standard",
    auto_scan_hit_count: payload.auto_scan_hit_count ?? 0,
    chat_snippet: payload.chat_snippet ?? null,
    chat_snapshot_json: payload.chat_snapshot_json ?? null,
  };
  appendLocal(full);

  try {
    const res = await fetch("/api/user-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(full),
    });
    if (!res.ok) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
