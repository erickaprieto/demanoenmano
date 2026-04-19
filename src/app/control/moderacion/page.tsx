"use client";

import type { AdminModerationAlert } from "@/lib/adminModerationQueue";
import { listAdminModerationAlerts } from "@/lib/adminModerationQueue";
import Link from "next/link";
import { useEffect, useState } from "react";

type RemoteRow = Record<string, unknown>;

export default function ModeracionControlPage() {
  const [local, setLocal] = useState<AdminModerationAlert[]>(() =>
    listAdminModerationAlerts(),
  );
  const [remote, setRemote] = useState<RemoteRow[]>([]);
  const [remoteSource, setRemoteSource] = useState<string>("");

  useEffect(() => {
    const sync = () => setLocal(listAdminModerationAlerts());
    window.addEventListener("vibe-admin-moderation-updated", sync);
    void fetch("/api/moderation/admin-alerts")
      .then((r) => r.json())
      .then((d: { rows?: RemoteRow[]; source?: string }) => {
        if (Array.isArray(d?.rows)) setRemote(d.rows);
        if (typeof d?.source === "string") setRemoteSource(d.source);
      })
      .catch(() => {});
    return () =>
      window.removeEventListener("vibe-admin-moderation-updated", sync);
  }, []);

  return (
    <div
      className="min-h-dvh px-4 py-8 text-zinc-100"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <Link
        href="/"
        className="text-sm font-medium text-violet-electric hover:underline"
      >
        ← Volver al inicio
      </Link>
      <h1 className="mt-6 text-xl font-semibold tracking-tight text-white">
        Panel de alertas (moderación)
      </h1>
      <p className="mt-2 max-w-lg text-sm text-zinc-500">
        Prioridad <span className="text-[#FF4B4B]">crítica</span> desde reportes
        con escaneo automático del chat. En demo, las alertas recientes también
        quedan en este navegador (localStorage).
      </p>

      {remoteSource === "database" && remote.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Base de datos
          </h2>
          <ul className="mt-3 space-y-3">
            {remote.map((row, idx) => (
              <li
                key={`db-${idx}-${String(row.reported_id ?? "")}-${String(row.created_at ?? "")}`}
                className="rounded-2xl border border-white/[0.08] bg-[#141414] p-4"
              >
                <p className="text-xs text-zinc-500">
                  {String(row.created_at ?? "")}
                </p>
                <p className="mt-1 text-sm text-white">
                  Severidad:{" "}
                  <span
                    className={
                      row.severity === "critical"
                        ? "font-semibold text-[#FF4B4B]"
                        : "text-zinc-300"
                    }
                  >
                    {String(row.severity ?? "")}
                  </span>
                </p>
                <a
                  href={String(row.chat_log_url ?? "#")}
                  className="mt-2 inline-block break-all text-sm text-violet-electric hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {String(row.chat_log_url ?? "")}
                </a>
                <p className="mt-2 font-mono text-xs text-zinc-500">
                  Reportado: {String(row.reported_id ?? "")} · Reporter:{" "}
                  {String(row.reporter_id ?? "")} · Hits:{" "}
                  {String(row.auto_scan_hit_count ?? "")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Cola local (esta sesión)
        </h2>
        {local.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">
            Aún no hay alertas. Enviá un reporte desde el chat con María G.
            (mensaje semilla con mención a whatsapp) para generar una alerta
            crítica de prueba.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {local.map((row) => (
              <li
                key={row.id}
                className="rounded-2xl border border-white/[0.08] bg-[#141414] p-4"
              >
                <p className="text-xs text-zinc-500">
                  {new Date(row.createdAt).toLocaleString("es-CR")}
                </p>
                <p className="mt-1 text-sm text-white">
                  Severidad:{" "}
                  <span
                    className={
                      row.severity === "critical"
                        ? "font-semibold text-[#FF4B4B]"
                        : "text-zinc-300"
                    }
                  >
                    {row.severity}
                  </span>
                </p>
                <a
                  href={row.chatLogUrl}
                  className="mt-2 inline-block break-all text-sm text-violet-electric hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {row.chatLogUrl}
                </a>
                <p className="mt-2 font-mono text-xs text-zinc-500">
                  Reportado: {row.reportedId} · Reporter: {row.reporterId} ·
                  Motivo: {row.reason} · Hits escaneo: {row.autoScanHitCount}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
