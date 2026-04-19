import type { Sql } from "postgres";
import { randomUUID } from "node:crypto";
import type { VendorQuestion } from "@/data/vendorVerificationQuestionnaire";
import {
  buildStaticTaxonomy,
  type MarketplaceTaxonomyPayload,
} from "@/lib/marketplaceTaxonomyStatic";

async function getSql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  const g = globalThis as unknown as { __vibePostgresTaxonomy?: Sql };
  if (!g.__vibePostgresTaxonomy) {
    const postgres = (await import("postgres")).default;
    g.__vibePostgresTaxonomy = postgres(url, { max: 1 });
  }
  return g.__vibePostgresTaxonomy;
}

export async function ensureMarketplaceTaxonomyTables(): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_categories (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_attributes (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES marketplace_categories(id) ON DELETE CASCADE,
      attr_key TEXT NOT NULL,
      label TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('yesno', 'tags')),
      options_json TEXT,
      good_answer TEXT,
      sort_order INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (category_id, attr_key)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS marketplace_attributes_cat_idx
    ON marketplace_attributes (category_id, sort_order)
  `;
}

function rowToVendorQuestion(row: {
  attr_key: string;
  label: string;
  kind: string;
  options_json: string | null;
  good_answer: string | null;
}): VendorQuestion {
  const base: VendorQuestion = {
    id: row.attr_key,
    label: row.label,
    kind: row.kind === "tags" ? "tags" : "yesno",
  };
  if (row.kind === "tags" && row.options_json) {
    try {
      const opts = JSON.parse(row.options_json) as string[];
      if (Array.isArray(opts) && opts.length > 0) {
        return { ...base, kind: "tags", options: opts };
      }
    } catch {
      /* fall through */
    }
    return { ...base, kind: "tags", options: [] };
  }
  if (row.good_answer === "yes" || row.good_answer === "no") {
    return { ...base, kind: "yesno", goodAnswer: row.good_answer };
  }
  return { ...base, kind: "yesno" };
}

export async function seedMarketplaceTaxonomyIfEmpty(): Promise<void> {
  const sql = await getSql();
  if (!sql) return;
  await ensureMarketplaceTaxonomyTables();
  const count = (await sql`
    SELECT COUNT(*)::int AS n FROM marketplace_categories
  `) as unknown as [{ n: number }];
  if ((count[0]?.n ?? 0) > 0) return;

  const staticTax = buildStaticTaxonomy();
  for (const c of staticTax.categories) {
    await sql`
      INSERT INTO marketplace_categories (id, label, sort_order, is_active, updated_at)
      VALUES (${c.id}, ${c.label}, ${c.sort_order}, true, NOW())
    `;
    const qs = staticTax.attributesByCategory[c.id] ?? [];
    let i = 0;
    for (const q of qs) {
      const optionsJson =
        q.kind === "tags" && q.options?.length
          ? JSON.stringify([...q.options])
          : null;
      await sql`
        INSERT INTO marketplace_attributes (
          id, category_id, attr_key, label, kind, options_json, good_answer, sort_order, updated_at
        )
        VALUES (
          ${randomUUID()},
          ${c.id},
          ${q.id},
          ${q.label},
          ${q.kind},
          ${optionsJson},
          ${q.kind === "yesno" && q.goodAnswer ? q.goodAnswer : null},
          ${i},
          NOW()
        )
      `;
      i += 1;
    }
  }
}

export async function loadMarketplaceTaxonomyFromDb(): Promise<MarketplaceTaxonomyPayload | null> {
  const sql = await getSql();
  if (!sql) return null;
  await ensureMarketplaceTaxonomyTables();
  await seedMarketplaceTaxonomyIfEmpty();

  const catRows = (await sql`
    SELECT id, label, sort_order
    FROM marketplace_categories
    WHERE is_active = true
    ORDER BY sort_order ASC, label ASC
  `) as unknown as Array<{ id: string; label: string; sort_order: number }>;

  if (catRows.length === 0) return null;

  const attrRows = (await sql`
    SELECT
      category_id,
      attr_key,
      label,
      kind,
      options_json,
      good_answer,
      sort_order
    FROM marketplace_attributes
    ORDER BY category_id, sort_order ASC, label ASC
  `) as unknown as Array<{
    category_id: string;
    attr_key: string;
    label: string;
    kind: string;
    options_json: string | null;
    good_answer: string | null;
    sort_order: number;
  }>;

  const attributesByCategory: Record<string, VendorQuestion[]> = {};
  for (const c of catRows) {
    attributesByCategory[c.id] = [];
  }
  for (const r of attrRows) {
    if (!attributesByCategory[r.category_id]) {
      attributesByCategory[r.category_id] = [];
    }
    attributesByCategory[r.category_id].push(rowToVendorQuestion(r));
  }

  return {
    categories: catRows.map((c) => ({
      id: c.id,
      label: c.label,
      sort_order: c.sort_order,
    })),
    attributesByCategory,
  };
}

export async function getMarketplaceTaxonomy(): Promise<MarketplaceTaxonomyPayload> {
  const fromDb = await loadMarketplaceTaxonomyFromDb();
  if (fromDb) return fromDb;
  return buildStaticTaxonomy();
}

/** Incluye categorías inactivas y ids de atributos (para panel admin). */
export type AdminAttributeRow = {
  id: string;
  category_id: string;
  attr_key: string;
  label: string;
  kind: "yesno" | "tags";
  options_json: string | null;
  good_answer: string | null;
  sort_order: number;
};

export type AdminCategoryRow = {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

export async function listAdminTaxonomy(): Promise<{
  categories: AdminCategoryRow[];
  attributes: AdminAttributeRow[];
}> {
  const sql = await getSql();
  if (!sql) {
    const st = buildStaticTaxonomy();
    return {
      categories: st.categories.map((c, i) => ({
        ...c,
        is_active: true,
      })),
      attributes: Object.entries(st.attributesByCategory).flatMap(([catId, qs]) =>
        qs.map((q, i) => ({
          id: `local-${catId}-${q.id}`,
          category_id: catId,
          attr_key: q.id,
          label: q.label,
          kind: q.kind,
          options_json:
            q.kind === "tags" && q.options ? JSON.stringify([...q.options]) : null,
          good_answer: q.kind === "yesno" ? q.goodAnswer ?? null : null,
          sort_order: i,
        })),
      ),
    };
  }
  await ensureMarketplaceTaxonomyTables();
  await seedMarketplaceTaxonomyIfEmpty();

  const categories = (await sql`
    SELECT id, label, sort_order, is_active
    FROM marketplace_categories
    ORDER BY sort_order ASC, label ASC
  `) as unknown as AdminCategoryRow[];

  const attributes = (await sql`
    SELECT
      id,
      category_id,
      attr_key,
      label,
      kind,
      options_json,
      good_answer,
      sort_order
    FROM marketplace_attributes
    ORDER BY category_id, sort_order ASC
  `) as unknown as AdminAttributeRow[];

  return { categories, attributes };
}

export function slugifyCategoryId(label: string): string {
  const s = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return s || `cat_${Date.now()}`;
}

export async function insertCategory(input: {
  id: string;
  label: string;
  sort_order?: number;
}): Promise<void> {
  const sql = await getSql();
  if (!sql) throw new Error("DATABASE_URL no configurada");
  await ensureMarketplaceTaxonomyTables();
  const sort =
    typeof input.sort_order === "number" ? input.sort_order : 999;
  await sql`
    INSERT INTO marketplace_categories (id, label, sort_order, is_active, updated_at)
    VALUES (${input.id}, ${input.label}, ${sort}, true, NOW())
  `;
}

export async function updateCategory(input: {
  id: string;
  label?: string;
  sort_order?: number;
  is_active?: boolean;
}): Promise<void> {
  const sql = await getSql();
  if (!sql) throw new Error("DATABASE_URL no configurada");
  await ensureMarketplaceTaxonomyTables();
  if (input.label !== undefined) {
    await sql`
      UPDATE marketplace_categories
      SET label = ${input.label}, updated_at = NOW()
      WHERE id = ${input.id}
    `;
  }
  if (input.sort_order !== undefined) {
    await sql`
      UPDATE marketplace_categories
      SET sort_order = ${input.sort_order}, updated_at = NOW()
      WHERE id = ${input.id}
    `;
  }
  if (input.is_active !== undefined) {
    await sql`
      UPDATE marketplace_categories
      SET is_active = ${input.is_active}, updated_at = NOW()
      WHERE id = ${input.id}
    `;
  }
}

export async function insertAttribute(input: {
  categoryId: string;
  attrKey: string;
  label: string;
  kind: "yesno" | "tags";
  options?: string[] | null;
  goodAnswer?: "yes" | "no" | null;
  sort_order?: number;
}): Promise<void> {
  const sql = await getSql();
  if (!sql) throw new Error("DATABASE_URL no configurada");
  await ensureMarketplaceTaxonomyTables();
  const id = randomUUID();
  const optionsJson =
    input.kind === "tags" && input.options?.length
      ? JSON.stringify(input.options)
      : null;
  const sort = typeof input.sort_order === "number" ? input.sort_order : 99;
  await sql`
    INSERT INTO marketplace_attributes (
      id, category_id, attr_key, label, kind, options_json, good_answer, sort_order, updated_at
    )
    VALUES (
      ${id},
      ${input.categoryId},
      ${input.attrKey},
      ${input.label},
      ${input.kind},
      ${optionsJson},
      ${input.kind === "yesno" ? input.goodAnswer ?? null : null},
      ${sort},
      NOW()
    )
  `;
}

export async function updateAttribute(input: {
  id: string;
  label?: string;
  kind?: "yesno" | "tags";
  options?: string[] | null;
  goodAnswer?: "yes" | "no" | null;
  sort_order?: number;
}): Promise<void> {
  const sql = await getSql();
  if (!sql) throw new Error("DATABASE_URL no configurada");
  if (input.label !== undefined) {
    await sql`
      UPDATE marketplace_attributes
      SET label = ${input.label}, updated_at = NOW()
      WHERE id = ${input.id}
    `;
  }
  if (input.sort_order !== undefined) {
    await sql`
      UPDATE marketplace_attributes
      SET sort_order = ${input.sort_order}, updated_at = NOW()
      WHERE id = ${input.id}
    `;
  }
  if (input.kind !== undefined) {
    await sql`
      UPDATE marketplace_attributes
      SET kind = ${input.kind}, updated_at = NOW()
      WHERE id = ${input.id}
    `;
  }
  if (input.options !== undefined) {
    const oj = input.options?.length ? JSON.stringify(input.options) : null;
    await sql`
      UPDATE marketplace_attributes
      SET options_json = ${oj}, updated_at = NOW()
      WHERE id = ${input.id}
    `;
  }
  if (input.goodAnswer !== undefined) {
    await sql`
      UPDATE marketplace_attributes
      SET good_answer = ${input.goodAnswer}, updated_at = NOW()
      WHERE id = ${input.id}
    `;
  }
}

export async function deleteAttribute(id: string): Promise<void> {
  const sql = await getSql();
  if (!sql) throw new Error("DATABASE_URL no configurada");
  await sql`DELETE FROM marketplace_attributes WHERE id = ${id}`;
}
