import { getOrCreateDemoUserId } from "./demoUserId";

const STORAGE_KEY = "vibe:alertas_busqueda:v1";

export type AlertaBusquedaRow = {
  usuario_id: string;
  termino_busqueda: string;
  /** Cadena vacía si la alerta no filtra por categoría. */
  categoria_id: string;
};

function normalizeTerm(t: string): string {
  return t.trim().toLowerCase();
}

function normalizeCat(id: string | null | undefined): string {
  return (id ?? "").trim();
}

function readLocal(): AlertaBusquedaRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is AlertaBusquedaRow =>
        x &&
        typeof x === "object" &&
        typeof (x as AlertaBusquedaRow).usuario_id === "string" &&
        typeof (x as AlertaBusquedaRow).termino_busqueda === "string" &&
        typeof (x as AlertaBusquedaRow).categoria_id === "string",
    );
  } catch {
    return [];
  }
}

function writeLocal(rows: AlertaBusquedaRow[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event("vibe-alertas-busqueda-updated"));
}

export function listSearchAlertsLocal(): AlertaBusquedaRow[] {
  return readLocal();
}

export function hasSearchAlert(
  term: string,
  categoriaId: string | null,
): boolean {
  const uid = getOrCreateDemoUserId();
  const t = normalizeTerm(term);
  const c = normalizeCat(categoriaId);
  if (!t) return false;
  return readLocal().some(
    (r) =>
      r.usuario_id === uid &&
      normalizeTerm(r.termino_busqueda) === t &&
      normalizeCat(r.categoria_id) === c,
  );
}

export async function saveSearchAlert(
  term: string,
  categoriaId: string | null,
): Promise<void> {
  const uid = getOrCreateDemoUserId();
  const t = term.trim();
  if (!t) return;
  const c = normalizeCat(categoriaId);
  const rows = readLocal().filter(
    (r) =>
      !(
        r.usuario_id === uid &&
        normalizeTerm(r.termino_busqueda) === normalizeTerm(t) &&
        normalizeCat(r.categoria_id) === c
      ),
  );
  rows.push({
    usuario_id: uid,
    termino_busqueda: t,
    categoria_id: c,
  });
  writeLocal(rows);

  try {
    await fetch("/api/alertas-busqueda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: uid,
        termino_busqueda: t,
        categoria_id: c || null,
      }),
    });
  } catch {
    /* offline: solo local */
  }
}

export async function removeSearchAlert(
  term: string,
  categoriaId: string | null,
): Promise<void> {
  const uid = getOrCreateDemoUserId();
  const t = normalizeTerm(term);
  const c = normalizeCat(categoriaId);
  const rows = readLocal().filter(
    (r) =>
      !(
        r.usuario_id === uid &&
        normalizeTerm(r.termino_busqueda) === t &&
        normalizeCat(r.categoria_id) === c
      ),
  );
  writeLocal(rows);

  try {
    await fetch("/api/alertas-busqueda", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: uid,
        termino_busqueda: term.trim(),
        categoria_id: c || null,
      }),
    });
  } catch {
    /* offline */
  }
}
