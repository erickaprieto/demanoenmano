"use client";

import {
  hasSearchAlert,
  removeSearchAlert,
  saveSearchAlert,
} from "@/lib/alertasBusqueda";
import {
  buildCategorySheetOptions,
  buildStaticTaxonomy,
  type MarketplaceTaxonomyPayload,
} from "@/lib/marketplaceTaxonomyStatic";
import { resolveCategoryLabel } from "@/lib/marketplaceTaxonomyResolve";
import { formatPrecioCRC } from "@/lib/formatColones";
import { Bell, BellRing, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DEMO_LISTINGS, type DemoListing } from "./mockListings";
import { SearchFilterSheet } from "./SearchFilterSheet";
import {
  CONDITION_OPTIONS,
  PRICE_OPTIONS,
  type QuickFilterKey,
} from "./searchFilterConfig";

function matchesPrice(
  price: number,
  priceId: string,
): boolean {
  const opt = PRICE_OPTIONS.find((p) => p.id === priceId);
  if (!opt || opt.min == null) return true;
  if (opt.max == null) return price >= opt.min;
  return price >= opt.min && price <= opt.max;
}

function filterListings(
  items: DemoListing[],
  query: string,
  categoryId: string | null,
  priceId: string,
  conditionId: string,
): DemoListing[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (q && !item.title.toLowerCase().includes(q)) return false;
    if (categoryId && item.categoryId !== categoryId) return false;
    if (!matchesPrice(item.priceColones, priceId)) return false;
    if (conditionId !== "any" && item.condition !== conditionId) return false;
    return true;
  });
}

function buildFallbackAlertTerm(
  cat: string | null,
  price: string,
  cond: string,
  taxonomy: MarketplaceTaxonomyPayload,
): string {
  const chunks: string[] = [];
  if (cat) chunks.push(resolveCategoryLabel(cat, taxonomy));
  const p = PRICE_OPTIONS.find((x) => x.id === price);
  if (p && p.id !== "any") chunks.push(p.label);
  const c = CONDITION_OPTIONS.find((x) => x.id === cond);
  if (c && c.id !== "any") chunks.push(c.label);
  return chunks.length ? chunks.join(" · ") : "Artículos en De Mano en Mano";
}

function EmptySearchIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="mx-auto h-36 w-44 text-zinc-600"
      aria-hidden
    >
      <circle
        cx="88"
        cy="72"
        r="36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="6 5"
        opacity={0.85}
      />
      <line
        x1="114"
        y1="98"
        x2="158"
        y2="132"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="88" cy="72" r="4" fill="currentColor" opacity={0.35} />
    </svg>
  );
}

export function BuscarClient() {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priceId, setPriceId] = useState<string>("any");
  const [conditionId, setConditionId] = useState<string>("any");
  const [sheet, setSheet] = useState<QuickFilterKey | null>(null);
  const [alertBump, setAlertBump] = useState(0);
  const [taxonomy, setTaxonomy] = useState<MarketplaceTaxonomyPayload | null>(null);

  useEffect(() => {
    void fetch("/api/public/marketplace-taxonomy")
      .then((r) => r.json())
      .then((d: MarketplaceTaxonomyPayload) => setTaxonomy(d))
      .catch(() => setTaxonomy(buildStaticTaxonomy()));
  }, []);

  const taxonomySafe = taxonomy ?? buildStaticTaxonomy();
  const categorySheetOptions = buildCategorySheetOptions(taxonomySafe.categories);

  const bumpAlerts = () => setAlertBump((n) => n + 1);

  const results = useMemo(
    () =>
      filterListings(
        DEMO_LISTINGS,
        query,
        categoryId,
        priceId,
        conditionId,
      ),
    [query, categoryId, priceId, conditionId],
  );

  const trimmedQuery = query.trim();
  const alertOn = useMemo(() => {
    if (!trimmedQuery) return false;
    void alertBump;
    return hasSearchAlert(trimmedQuery, categoryId);
  }, [trimmedQuery, categoryId, alertBump]);

  const toggleAlert = async () => {
    const t = query.trim();
    if (!t) return;
    if (alertOn) await removeSearchAlert(t, categoryId);
    else await saveSearchAlert(t, categoryId);
    bumpAlerts();
  };

  const activateAlertFromEmpty = async () => {
    const t =
      trimmedQuery ||
      buildFallbackAlertTerm(categoryId, priceId, conditionId, taxonomySafe);
    await saveSearchAlert(t, categoryId);
    bumpAlerts();
  };

  const categoryPillActive = categoryId !== null;
  const pricePillActive = priceId !== "any";
  const conditionPillActive = conditionId !== "any";

  const categoryShort = categoryId
    ? resolveCategoryLabel(categoryId, taxonomySafe)
    : "Categoría";
  const priceShort =
    priceId === "any"
      ? "Precio"
      : (PRICE_OPTIONS.find((p) => p.id === priceId)?.label ?? "Precio");
  const conditionShort =
    conditionId === "any"
      ? "Estado"
      : (CONDITION_OPTIONS.find((c) => c.id === conditionId)?.label ??
        "Estado");

  const pillBase =
    "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition";
  const pillInactive = `${pillBase} border-white/10 bg-white/[0.03] text-zinc-300`;
  const pillActive = `${pillBase} border-violet-electric bg-violet-electric/10 text-neon-green shadow-[0_0_20px_-8px_rgba(138,43,226,0.5)]`;

  return (
    <div
      className="flex min-h-full flex-col px-4 pb-8 pt-6"
      style={{ backgroundColor: "#1A1A1A" }}
    >
      <header className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-electric">
          Explorar
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Buscar
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Encontrá artículos con filtros rápidos y alertas cuando aparezca lo que
          buscás.
        </p>
      </header>

      <div
        className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-[#242424] px-3 ring-1 ring-white/[0.04]"
        role="search"
      >
        <Search className="size-5 shrink-0 text-zinc-500" strokeWidth={2} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en De Mano en Mano…"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          type="search"
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      <div className="relative z-0 mt-3 -mx-4">
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setSheet("categoria")}
            className={categoryPillActive ? pillActive : pillInactive}
          >
            {categoryShort}
          </button>
          <button
            type="button"
            onClick={() => setSheet("precio")}
            className={pricePillActive ? pillActive : pillInactive}
          >
            {priceShort}
          </button>
          <button
            type="button"
            onClick={() => setSheet("estado")}
            className={conditionPillActive ? pillActive : pillInactive}
          >
            {conditionShort}
          </button>
        </div>
      </div>

      {query.trim() ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void toggleAlert()}
            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              alertOn
                ? "border-neon-green/40 bg-neon-green/10"
                : "border-white/[0.08] bg-[#242424]"
            }`}
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                alertOn
                  ? "bg-neon-green/20 text-neon-green"
                  : "bg-white/[0.06] text-zinc-400"
              }`}
            >
              {alertOn ? (
                <BellRing className="size-5" strokeWidth={2} />
              ) : (
                <Bell className="size-5" strokeWidth={2} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block text-sm font-semibold ${
                  alertOn ? "text-neon-green" : "text-white"
                }`}
              >
                {alertOn
                  ? "Alerta activa para esta búsqueda"
                  : "Crear alerta para esta búsqueda"}
              </span>
              <span className="mt-0.5 block text-[11px] text-zinc-500">
                Te avisamos cuando haya novedades que coincidan con tu término
                {categoryId ? " y la categoría elegida" : ""}.
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                alertOn
                  ? "bg-neon-green text-black"
                  : "bg-zinc-700 text-zinc-300"
              }`}
            >
              {alertOn ? "Encendido" : "Tocar"}
            </span>
          </button>
        </div>
      ) : null}

      <section className="mt-6 flex-1">
        {results.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <EmptySearchIllustration />
            <p className="mt-4 text-sm font-medium text-zinc-300">
              No hay resultados
            </p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-zinc-500">
              Probá otra palabra o ajustá los filtros, o activá una alerta abajo.
            </p>
            <button
              type="button"
              onClick={() => void activateAlertFromEmpty()}
              className="mt-8 w-full max-w-sm rounded-2xl bg-neon-green py-4 text-sm font-bold text-black shadow-[0_0_32px_-6px_rgba(51,255,0,0.45)] transition hover:brightness-110"
            >
              Activar alerta para{" "}
              <span className="break-words">
                &quot;
                {trimmedQuery ||
                  buildFallbackAlertTerm(
                    categoryId,
                    priceId,
                    conditionId,
                    taxonomySafe,
                  )}
                &quot;
              </span>
            </button>
            <p className="mt-3 max-w-xs text-[11px] leading-relaxed text-zinc-600">
              Te avisaremos por notificación push en cuanto alguien suba este
              artículo.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {results.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-white/[0.06] bg-[#242424] p-4 ring-1 ring-white/[0.04]"
              >
                <p className="font-medium text-white">{item.title}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {resolveCategoryLabel(item.categoryId, taxonomySafe)}
                </p>
                <p className="mt-2 font-mono text-sm text-neon-green">
                  {formatPrecioCRC(item.priceColones)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SearchFilterSheet
        open={sheet}
        onClose={() => setSheet(null)}
        categoryId={categoryId}
        onPickCategory={setCategoryId}
        priceId={priceId}
        onPickPrice={setPriceId}
        conditionId={conditionId}
        onPickCondition={setConditionId}
        categorySheetOptions={categorySheetOptions}
      />
    </div>
  );
}
