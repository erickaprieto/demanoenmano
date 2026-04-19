"use client";

import { AdminMarketplaceTaxonomySection } from "@/components/admin/AdminMarketplaceTaxonomySection";
import { AdminProductActivitySection } from "@/components/admin/AdminProductActivitySection";
import { USER_PASSWORD_REQUIREMENTS_SHORT } from "@/lib/auth/passwordPolicy";
import { USER_REPORT_REASON_LABELS, type UserReportReason } from "@/lib/userReports";
import { useCallback, useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  createdAt: string;
  flagged: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  approvalReason: string | null;
  approvalReviewedAt: string | null;
};

type AdminProduct = {
  id: string;
  name: string;
  sellerUserId: string;
  disabled: boolean;
  reason: string | null;
};

type SellerVerification = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  cedula: string;
  iban: string;
  selfieImageDataUrl: string;
  status: "pending" | "approved" | "rejected";
  autoChecks: string[];
  rejectReason: string | null;
};

type PayoutRelease = {
  id: string;
  orderId: string;
  sellerUserId: string;
  trackingNumber: string;
  status: "pending" | "released";
  createdAt: string;
  updatedAt: string;
  releasedAt: string | null;
};

type ChatReportRow = {
  id: string;
  created_at: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  comments: string | null;
  context_chat_id: string;
  severity: string;
  auto_scan_hit_count: number;
  chat_snippet: string | null;
};

type ChatSnapshotLine = {
  from: string;
  body: string;
  at: number;
};

export function AdminPanelScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [kycRows, setKycRows] = useState<SellerVerification[]>([]);
  const [payoutRows, setPayoutRows] = useState<PayoutRelease[]>([]);
  const [rejectDraft, setRejectDraft] = useState<Record<string, string>>({});
  const [userReviewDraft, setUserReviewDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [manualPasswordByUser, setManualPasswordByUser] = useState<Record<string, string>>({});
  const [lastReset, setLastReset] = useState<{ userId: string; password: string } | null>(null);
  const [chatReports, setChatReports] = useState<ChatReportRow[]>([]);
  const [fullChatModal, setFullChatModal] = useState<{
    reportId: string;
    threadId: string;
    lines: ChatSnapshotLine[];
  } | null>(null);
  const [fullChatLoading, setFullChatLoading] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const [uRes, pRes, kRes, prRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/products"),
        fetch("/api/admin/seller-verifications"),
        fetch("/api/admin/payout-releases"),
      ]);
      if (!uRes.ok || !pRes.ok || !kRes.ok || !prRes.ok) {
        setError("No se pudo cargar panel admin.");
        return;
      }
      const u = (await uRes.json()) as { users?: AdminUser[] };
      const p = (await pRes.json()) as { products?: AdminProduct[] };
      const k = (await kRes.json()) as {
        rows?: SellerVerification[];
      };
      const pr = (await prRes.json()) as { rows?: PayoutRelease[] };
      setUsers(Array.isArray(u.users) ? u.users : []);
      setProducts(Array.isArray(p.products) ? p.products : []);
      setKycRows(Array.isArray(k.rows) ? k.rows : []);
      setPayoutRows(Array.isArray(pr.rows) ? pr.rows : []);

      const crRes = await fetch("/api/admin/chat-reports");
      if (crRes.ok) {
        const cr = (await crRes.json()) as { rows?: ChatReportRow[] };
        setChatReports(Array.isArray(cr.rows) ? cr.rows : []);
      } else {
        setChatReports([]);
      }
    } catch {
      setError("Error de red cargando panel.");
    }
  };

  const openFullChatReport = useCallback(async (reportId: string, threadId: string) => {
    setFullChatLoading(true);
    setFullChatModal(null);
    try {
      const res = await fetch(
        `/api/admin/chat-reports?id=${encodeURIComponent(reportId)}`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        row?: {
          chat_snapshot_json: string | null;
          context_chat_id: string;
        };
      };
      const raw = data.row?.chat_snapshot_json;
      let lines: ChatSnapshotLine[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            lines = parsed.filter(
              (x): x is ChatSnapshotLine =>
                x != null &&
                typeof x === "object" &&
                typeof (x as ChatSnapshotLine).body === "string" &&
                typeof (x as ChatSnapshotLine).from === "string",
            );
          }
        } catch {
          lines = [];
        }
      }
      setFullChatModal({
        reportId,
        threadId: data.row?.context_chat_id ?? threadId,
        lines,
      });
    } finally {
      setFullChatLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, []);

  const banUser = async (userId: string, banned: boolean) => {
    await fetch("/api/admin/users/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, banned }),
    });
    await load();
  };

  const disableProduct = async (listingId: string, disabled: boolean) => {
    await fetch("/api/admin/products/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        disabled,
        reason: disabled ? "Deshabilitado por admin" : null,
      }),
    });
    await load();
  };

  const resetPassword = async (userId: string) => {
    setError(null);
    setLastReset(null);
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          newPassword: manualPasswordByUser[userId] ?? "",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        temporaryPassword?: string;
        userId?: string;
      };
      if (!res.ok || !data.temporaryPassword || !data.userId) {
        setError(data.error ?? "No se pudo resetear contraseña.");
        return;
      }
      setLastReset({ userId: data.userId, password: data.temporaryPassword });
      setManualPasswordByUser((prev) => ({ ...prev, [userId]: "" }));
    } catch {
      setError("Error de red al resetear contraseña.");
    }
  };

  const reviewUser = async (userId: string, decision: "approved" | "rejected") => {
    const reason =
      decision === "rejected"
        ? (userReviewDraft[userId] ?? "").trim() || "Registro rechazado por administración."
        : null;
    await fetch("/api/admin/users/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, decision, reason }),
    });
    await load();
  };

  const reviewKyc = async (
    id: string,
    decision: "approved" | "rejected",
  ) => {
    const reason =
      decision === "rejected"
        ? (rejectDraft[id] ?? "").trim() || "Imagen no cumple requisitos."
        : null;
    await fetch("/api/admin/seller-verifications/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision, reason }),
    });
    await load();
  };

  const reviewPayoutRelease = async (id: string, decision: "released" | "pending") => {
    await fetch("/api/admin/payout-releases/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    await load();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 text-zinc-100">
      {users.some((u) => u.approvalStatus === "pending") ? (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          Hay {users.filter((u) => u.approvalStatus === "pending").length} usuario(s) pendiente(s) de aprobación.
        </p>
      ) : null}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gestión de usuarios y productos
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            void fetch("/api/admin/auth/logout", { method: "POST" }).finally(() => {
              window.location.assign("/admin/login");
            })
          }
          className="rounded-xl border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-200"
        >
          Cerrar sesión admin
        </button>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {lastReset ? (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          Password reseteado para <span className="font-mono">{lastReset.userId}</span>:{" "}
          <span className="font-mono">{lastReset.password}</span>. Compartilo de forma segura y pedí cambio inmediato.
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Usuarios
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2">Nombre</th>
                <th className="py-2">Email</th>
                <th className="py-2">Teléfono</th>
                <th className="py-2">Aprobación</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="py-2">{u.fullName}</td>
                  <td className="py-2 font-mono text-zinc-300">{u.email}</td>
                  <td className="py-2">{u.phone}</td>
                  <td className="py-2">
                    {u.approvalStatus === "approved" ? (
                      <span className="text-neon-green">Aprobado</span>
                    ) : u.approvalStatus === "rejected" ? (
                      <span className="text-red-300">Rechazado</span>
                    ) : (
                      <span className="text-amber-200">Pendiente</span>
                    )}
                    {u.approvalReason ? (
                      <p className="mt-1 max-w-56 text-[11px] text-zinc-500">{u.approvalReason}</p>
                    ) : null}
                  </td>
                  <td className="py-2">
                    {u.flagged ? (
                      <span className="text-red-300">Baneado</span>
                    ) : (
                      <span className="text-neon-green">Activo</span>
                    )}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void banUser(u.id, !u.flagged)}
                        className="rounded-lg border border-violet-electric/50 px-2 py-1 font-semibold text-violet-100"
                      >
                        {u.flagged ? "Quitar ban" : "Banear"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void reviewUser(u.id, "approved")}
                        className="rounded-lg border border-neon-green/50 px-2 py-1 font-semibold text-neon-green"
                      >
                        Aprobar acceso
                      </button>
                      <input
                        type="text"
                        value={userReviewDraft[u.id] ?? ""}
                        onChange={(e) =>
                          setUserReviewDraft((prev) => ({
                            ...prev,
                            [u.id]: e.target.value,
                          }))
                        }
                        placeholder="Motivo rechazo acceso"
                        className="w-44 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1 text-[11px] text-white"
                      />
                      <button
                        type="button"
                        onClick={() => void reviewUser(u.id, "rejected")}
                        className="rounded-lg border border-red-400/50 px-2 py-1 font-semibold text-red-200"
                      >
                        Rechazar acceso
                      </button>
                      <input
                        type="text"
                        value={manualPasswordByUser[u.id] ?? ""}
                        onChange={(e) =>
                          setManualPasswordByUser((prev) => ({
                            ...prev,
                            [u.id]: e.target.value,
                          }))
                        }
                        placeholder="Nueva pass (opcional)"
                        title={USER_PASSWORD_REQUIREMENTS_SHORT}
                        className="w-44 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1 text-[11px] text-white"
                      />
                      <button
                        type="button"
                        onClick={() => void resetPassword(u.id)}
                        className="rounded-lg border border-amber-400/50 px-2 py-1 font-semibold text-amber-200"
                      >
                        Reset password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Liberación de fondos por guía
        </h2>
        <div className="mt-3 space-y-3">
          {payoutRows.length === 0 ? (
            <p className="text-xs text-zinc-500">
              Sin notificaciones de guía por revisar.
            </p>
          ) : (
            payoutRows.map((row) => (
              <article
                key={row.id}
                className="rounded-xl border border-white/10 bg-[#141414] p-3"
              >
                <p className="text-xs text-zinc-400">
                  orden: <span className="font-mono">{row.orderId}</span> · vendedor:{" "}
                  <span className="font-mono">{row.sellerUserId}</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  guía: <span className="font-mono text-zinc-300">{row.trackingNumber}</span>
                </p>
                <p className="mt-1 text-xs">
                  estado:{" "}
                  <span className={row.status === "released" ? "text-neon-green" : "text-amber-200"}>
                    {row.status === "released" ? "liberado" : "pendiente"}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void reviewPayoutRelease(row.id, "released")}
                    className="rounded-lg border border-neon-green/50 px-2 py-1 text-xs font-semibold text-neon-green"
                  >
                    Liberar fondos
                  </button>
                  <button
                    type="button"
                    onClick={() => void reviewPayoutRelease(row.id, "pending")}
                    className="rounded-lg border border-amber-400/50 px-2 py-1 text-xs font-semibold text-amber-200"
                  >
                    Marcar pendiente
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Reportes de chat
        </h2>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          Cuando un usuario reporta desde Mensajes, se guarda un fragmento de la conversación.
          Usá &quot;Ver chat completo&quot; solo si necesitás más contexto para investigar; respetá
          privacidad y minimización de datos.
        </p>
        <div className="mt-3 space-y-3">
          {chatReports.length === 0 ? (
            <p className="text-xs text-zinc-500">
              Sin reportes con contexto de chat en base de datos (o DATABASE_URL no configurada).
            </p>
          ) : (
            chatReports.map((row) => {
              const reasonKey = row.reason as UserReportReason;
              const reasonLabel =
                reasonKey && reasonKey in USER_REPORT_REASON_LABELS
                  ? USER_REPORT_REASON_LABELS[reasonKey].short
                  : row.reason;
              return (
                <article
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-[#141414] p-3"
                >
                  <p className="text-[10px] text-zinc-500">{row.created_at}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Reportante: <span className="font-mono">{row.reporter_id}</span> → Reportado:{" "}
                    <span className="font-mono">{row.reported_id}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-300">
                    Motivo: <span className="text-violet-200">{reasonLabel}</span>
                    {row.severity === "critical" ? (
                      <span className="ml-2 font-semibold text-red-300">· crítico</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Hilo: <span className="font-mono text-zinc-400">{row.context_chat_id}</span>
                  </p>
                  {row.comments ? (
                    <p className="mt-2 text-xs text-zinc-400">Comentarios: {row.comments}</p>
                  ) : null}
                  <div className="mt-3 rounded-lg border border-white/[0.06] bg-zinc-950/80 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                      Fragmento reportado
                    </p>
                    <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-zinc-300">
                      {row.chat_snippet ?? "(Sin fragmento; reporte previo a esta función o sin mensajes capturados.)"}
                    </pre>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={fullChatLoading}
                      onClick={() => void openFullChatReport(row.id, row.context_chat_id)}
                      className="rounded-lg border border-neon-green/50 px-2 py-1 text-xs font-semibold text-neon-green disabled:opacity-50"
                    >
                      Ver chat completo
                    </button>
                    <a
                      href={`/mensajes?thread=${encodeURIComponent(row.context_chat_id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-violet-electric/50 px-2 py-1 text-xs font-semibold text-violet-200"
                    >
                      Abrir hilo en app
                    </a>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {fullChatModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Conversación completa del reporte"
        >
          <div className="max-h-[min(85dvh,32rem)] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-white">Chat completo (moderación)</p>
              <button
                type="button"
                onClick={() => setFullChatModal(null)}
                className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                Cerrar
              </button>
            </div>
            <p className="border-b border-white/[0.06] px-4 py-2 text-[10px] leading-relaxed text-amber-200/90">
              Uso interno: no compartir fuera del equipo. Solo mensajes capturados al momento del
              reporte (ventana acotada).
            </p>
            <div className="max-h-[min(65dvh,26rem)] overflow-y-auto px-4 py-3">
              {fullChatModal.lines.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No hay snapshot JSON guardado para este reporte (p. ej. reporte antiguo o envío
                  sin datos de chat).
                </p>
              ) : (
                <ul className="space-y-2">
                  {fullChatModal.lines.map((line, idx) => (
                    <li
                      key={`${line.at}-${idx}`}
                      className="rounded-lg border border-white/[0.06] bg-zinc-950/60 px-2.5 py-2 text-xs"
                    >
                      <p className="font-semibold text-violet-200">
                        {line.from === "reportante" ? "Reportante" : "Reportado"}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-zinc-300">
                        {line.body}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-600">
                        {new Date(line.at).toLocaleString("es-CR")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-white/10 px-4 py-2 text-center">
              <a
                href={`/mensajes?thread=${encodeURIComponent(fullChatModal.threadId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-violet-300 hover:underline"
              >
                Abrir hilo en app (nueva pestaña)
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <AdminMarketplaceTaxonomySection />
      <AdminProductActivitySection />

      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Verificación de vendedores (selfie + cédula)
        </h2>
        <div className="mt-3 space-y-3">
          {kycRows.map((row) => (
            <article
              key={row.id}
              className="rounded-xl border border-white/10 bg-[#141414] p-3"
            >
              <p className="text-xs text-zinc-400">
                {row.fullName} · <span className="font-mono">{row.email}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                cédula: {row.cedula} · IBAN: {row.iban}
              </p>
              <p className="mt-1 text-xs">
                Estado:{" "}
                <span
                  className={
                    row.status === "approved"
                      ? "text-neon-green"
                      : row.status === "rejected"
                        ? "text-red-300"
                        : "text-amber-200"
                  }
                >
                  {row.status}
                </span>
              </p>
              {row.autoChecks.length > 0 ? (
                <p className="mt-1 text-[11px] text-zinc-500">
                  auto-checks: {row.autoChecks.join(", ")}
                </p>
              ) : null}
              <div className="mt-2">
                <img
                  src={row.selfieImageDataUrl}
                  alt={`Selfie KYC ${row.userId}`}
                  className="max-h-56 w-auto rounded-lg border border-white/10"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void reviewKyc(row.id, "approved")}
                  className="rounded-lg border border-neon-green/50 px-2 py-1 text-xs font-semibold text-neon-green"
                >
                  Aprobar
                </button>
                <input
                  type="text"
                  value={rejectDraft[row.id] ?? ""}
                  onChange={(e) =>
                    setRejectDraft((prev) => ({ ...prev, [row.id]: e.target.value }))
                  }
                  placeholder="Motivo de rechazo"
                  className="w-56 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => void reviewKyc(row.id, "rejected")}
                  className="rounded-lg border border-red-400/50 px-2 py-1 text-xs font-semibold text-red-200"
                >
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Productos
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2">Producto</th>
                <th className="py-2">Seller ID</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2 font-mono text-zinc-300">{p.sellerUserId}</td>
                  <td className="py-2">
                    {p.disabled ? (
                      <span className="text-red-300">Deshabilitado</span>
                    ) : (
                      <span className="text-neon-green">Activo</span>
                    )}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => void disableProduct(p.id, !p.disabled)}
                      className="rounded-lg border border-violet-electric/50 px-2 py-1 font-semibold text-violet-100"
                    >
                      {p.disabled ? "Habilitar" : "Deshabilitar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
