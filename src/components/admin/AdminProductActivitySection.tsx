"use client";

import { useEffect, useMemo, useState } from "react";

type ActivityType = "all" | "new" | "reported" | "disabled";

type ActivityRow = {
  listingId: string;
  listingName: string;
  sellerUserId: string;
  activityType: Exclude<ActivityType, "all">;
  activityAt: string;
  reason: string | null;
  reportCount: number;
};

type ActivityResponse = {
  rows?: ActivityRow[];
  metrics?: {
    newProducts: number;
    reportedProducts: number;
    disabledProducts: number;
  };
};

const WINDOW_OPTIONS = [
  { value: 24, label: "24 horas" },
  { value: 72, label: "3 días" },
  { value: 168, label: "7 días" },
];

const TYPE_LABELS: Record<ActivityType, string> = {
  all: "Todos",
  new: "Nuevos",
  reported: "Reportados",
  disabled: "Deshabilitados",
};

export function AdminProductActivitySection() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [metrics, setMetrics] = useState({
    newProducts: 0,
    reportedProducts: 0,
    disabledProducts: 0,
  });
  const [windowHours, setWindowHours] = useState(24);
  const [activityType, setActivityType] = useState<ActivityType>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(
      `/api/admin/products/activity?windowHours=${windowHours}&activityType=${activityType}`,
    )
      .then((res) => res.json())
      .then((data: ActivityResponse) => {
        if (cancelled) return;
        setRows(Array.isArray(data.rows) ? data.rows : []);
        setMetrics({
          newProducts: data.metrics?.newProducts ?? 0,
          reportedProducts: data.metrics?.reportedProducts ?? 0,
          disabledProducts: data.metrics?.disabledProducts ?? 0,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [windowHours, activityType]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.listingName.toLowerCase().includes(q) ||
        row.listingId.toLowerCase().includes(q) ||
        row.sellerUserId.toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Actividad reciente de productos
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Métricas y eventos por producto: nuevos, reportados y deshabilitados.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
          <p className="text-[11px] uppercase tracking-wide text-emerald-200/80">
            Nuevos
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-200">
            {metrics.newProducts}
          </p>
        </div>
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3">
          <p className="text-[11px] uppercase tracking-wide text-amber-200/80">
            Reportados
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-200">
            {metrics.reportedProducts}
          </p>
        </div>
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3">
          <p className="text-[11px] uppercase tracking-wide text-red-200/80">
            Deshabilitados
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-200">
            {metrics.disabledProducts}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={windowHours}
          onChange={(e) => setWindowHours(Number.parseInt(e.target.value, 10))}
          className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white"
        >
          {WINDOW_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Ventana: {opt.label}
            </option>
          ))}
        </select>
        <select
          value={activityType}
          onChange={(e) => setActivityType(e.target.value as ActivityType)}
          className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white"
        >
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              Tipo: {label}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por producto, id o seller"
          className="w-72 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white"
        />
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="text-zinc-500">
            <tr>
              <th className="py-2">Producto</th>
              <th className="py-2">Tipo</th>
              <th className="py-2">Fecha</th>
              <th className="py-2">Seller</th>
              <th className="py-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="border-t border-white/10 py-4 text-zinc-500">
                  Cargando actividad...
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="border-t border-white/10 py-4 text-zinc-500">
                  No hay eventos para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={`${row.activityType}-${row.listingId}-${row.activityAt}`} className="border-t border-white/10">
                  <td className="py-2">
                    <p className="text-zinc-200">{row.listingName}</p>
                    <p className="font-mono text-[11px] text-zinc-500">{row.listingId}</p>
                  </td>
                  <td className="py-2">
                    {row.activityType === "new" ? (
                      <span className="text-emerald-200">Nuevo</span>
                    ) : row.activityType === "reported" ? (
                      <span className="text-amber-200">Reportado</span>
                    ) : (
                      <span className="text-red-300">Deshabilitado</span>
                    )}
                  </td>
                  <td className="py-2 text-zinc-400">
                    {new Date(row.activityAt).toLocaleString("es-CR")}
                  </td>
                  <td className="py-2 font-mono text-zinc-300">{row.sellerUserId}</td>
                  <td className="py-2 text-zinc-400">
                    {row.activityType === "reported"
                      ? `${row.reportCount} reporte(s)`
                      : row.reason ?? "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
