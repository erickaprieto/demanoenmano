"use client";

import { useCallback, useEffect, useId, useState } from "react";

type AdminCategoryRow = {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

type AdminAttributeRow = {
  id: string;
  category_id: string;
  attr_key: string;
  label: string;
  kind: "yesno" | "tags";
  options_json: string | null;
  good_answer: string | null;
  sort_order: number;
};

export function AdminMarketplaceTaxonomySection() {
  const formId = useId();
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [attributes, setAttributes] = useState<AdminAttributeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatId, setNewCatId] = useState("");
  const [attrDraft, setAttrDraft] = useState<{
    categoryId: string;
    label: string;
    kind: "yesno" | "tags";
    optionsLine: string;
    goodYes: boolean;
  }>({
    categoryId: "",
    label: "",
    kind: "yesno",
    optionsLine: "",
    goodYes: true,
  });

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/marketplace-taxonomy");
      if (!res.ok) {
        setError("No se pudo cargar taxonomía.");
        return;
      }
      const d = (await res.json()) as {
        categories?: AdminCategoryRow[];
        attributes?: AdminAttributeRow[];
      };
      setCategories(Array.isArray(d.categories) ? d.categories : []);
      setAttributes(Array.isArray(d.attributes) ? d.attributes : []);
    } catch {
      setError("Error de red.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createCategory = async () => {
    setError(null);
    const label = newCatLabel.trim();
    if (label.length < 2) return;
    const res = await fetch("/api/admin/marketplace-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        id: newCatId.trim() || undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear categoría.");
      return;
    }
    setNewCatLabel("");
    setNewCatId("");
    await load();
  };

  const addAttribute = async () => {
    setError(null);
    const { categoryId, label, kind, optionsLine, goodYes } = attrDraft;
    if (!categoryId || label.trim().length < 2) return;
    const options =
      kind === "tags"
        ? optionsLine
            .split(/[,|]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    const res = await fetch("/api/admin/marketplace-attributes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId,
        label: label.trim(),
        kind,
        options,
        goodAnswer: kind === "yesno" ? (goodYes ? "yes" : "no") : null,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear atributo.");
      return;
    }
    setAttrDraft((d) => ({ ...d, label: "", optionsLine: "" }));
    await load();
  };

  const deleteAttr = async (id: string) => {
    if (!id.startsWith("local-") && !confirm("¿Eliminar este atributo?")) return;
    if (id.startsWith("local-")) {
      setError("Sin DATABASE_URL solo se muestra el catálogo embebido; no se puede editar.");
      return;
    }
    await fetch(`/api/admin/marketplace-attributes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await load();
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Categorías y atributos del marketplace
      </h2>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
        Creá categorías (ej. &quot;Moda Eco-Responsable&quot;) y definí preguntas de la ficha técnica:
        Sí/No o listas (ej. tallas). Requiere{" "}
        <span className="font-mono text-zinc-400">DATABASE_URL</span>; la primera carga copia el
        catálogo actual a la base.
      </p>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}

      <div className="mt-4 rounded-xl border border-white/10 bg-[#141414] p-3">
        <p className="text-xs font-medium text-zinc-300">Nueva categoría</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            id={`${formId}-newcat-label`}
            value={newCatLabel}
            onChange={(e) => setNewCatLabel(e.target.value)}
            placeholder="Ej. Moda Eco-Responsable, Libros usados"
            className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white"
          />
          <input
            id={`${formId}-newcat-id`}
            value={newCatId}
            onChange={(e) => setNewCatId(e.target.value)}
            placeholder="id slug (opcional, auto si vacío)"
            className="w-48 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 font-mono text-[11px] text-zinc-300"
          />
          <button
            type="button"
            onClick={() => void createCategory()}
            className="rounded-lg border border-neon-green/50 px-3 py-1.5 text-xs font-semibold text-neon-green"
          >
            Crear categoría
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {categories.map((c) => (
          <article
            key={c.id}
            className="rounded-xl border border-white/10 bg-[#141414] p-3"
          >
            <p className="text-sm font-medium text-white">
              {c.label}{" "}
              <span className="font-mono text-[11px] text-zinc-500">({c.id})</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              orden: {c.sort_order} ·{" "}
              {c.is_active ? (
                <span className="text-neon-green">activa</span>
              ) : (
                <span className="text-zinc-600">inactiva</span>
              )}
            </p>
            <ul className="mt-2 space-y-1 border-t border-white/[0.06] pt-2">
              {attributes
                .filter((a) => a.category_id === c.id)
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400"
                  >
                    <span>
                      <span className="text-zinc-200">{a.label}</span>{" "}
                      <span className="font-mono text-zinc-600">
                        [{a.kind}] {a.attr_key}
                      </span>
                      {a.kind === "tags" && a.options_json ? (
                        <span className="ml-1 text-zinc-500">
                          · {a.options_json}
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => void deleteAttr(a.id)}
                      className="shrink-0 text-red-300 hover:underline"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-violet-electric/25 bg-violet-electric/10 p-3">
        <p className="text-xs font-medium text-violet-100">Nuevo atributo en categoría</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="text-[11px] text-zinc-500">
            Categoría
            <select
              value={attrDraft.categoryId}
              onChange={(e) =>
                setAttrDraft((d) => ({ ...d, categoryId: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white"
            >
              <option value="">Elegí…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-zinc-500">
            Pregunta / etiqueta
            <input
              value={attrDraft.label}
              onChange={(e) =>
                setAttrDraft((d) => ({ ...d, label: e.target.value }))
              }
              placeholder='Ej. Talla: S/M/L o Estado: Como nuevo / Usado'
              className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white"
            />
          </label>
          <label className="text-[11px] text-zinc-500">
            Tipo
            <select
              value={attrDraft.kind}
              onChange={(e) =>
                setAttrDraft((d) => ({
                  ...d,
                  kind: e.target.value === "tags" ? "tags" : "yesno",
                }))
              }
              className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white"
            >
              <option value="yesno">Sí / No</option>
              <option value="tags">Lista de opciones</option>
            </select>
          </label>
          {attrDraft.kind === "tags" ? (
            <label className="text-[11px] text-zinc-500 sm:col-span-2">
              Opciones (separadas por coma o |)
              <input
                value={attrDraft.optionsLine}
                onChange={(e) =>
                  setAttrDraft((d) => ({ ...d, optionsLine: e.target.value }))
                }
                placeholder="S, M, L, XL o Como nuevo, Usado"
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white"
              />
            </label>
          ) : (
            <label className="flex items-center gap-2 text-[11px] text-zinc-400">
              <input
                type="checkbox"
                checked={attrDraft.goodYes}
                onChange={(e) =>
                  setAttrDraft((d) => ({ ...d, goodYes: e.target.checked }))
                }
              />
              Respuesta favorable para el comprador:{" "}
              <span className="text-zinc-300">{attrDraft.goodYes ? "Sí" : "No"}</span>{" "}
              (verde en ficha)
            </label>
          )}
        </div>
        <button
          type="button"
          onClick={() => void addAttribute()}
          className="mt-3 rounded-lg border border-violet-electric/50 px-3 py-1.5 text-xs font-semibold text-violet-100"
        >
          Añadir atributo
        </button>
      </div>

    </section>
  );
}
