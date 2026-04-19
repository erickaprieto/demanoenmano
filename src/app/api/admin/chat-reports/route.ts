import { NextResponse } from "next/server";
import type { Sql } from "postgres";
import { requireAdminSession } from "@/app/api/admin/_lib";

export const runtime = "nodejs";

async function getSql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  const g = globalThis as unknown as { __vibePostgresAdminChatReports?: Sql };
  if (!g.__vibePostgresAdminChatReports) {
    const postgres = (await import("postgres")).default;
    g.__vibePostgresAdminChatReports = postgres(url, { max: 1 });
  }
  return g.__vibePostgresAdminChatReports;
}

async function ensureUserReportsChatColumns(sql: Sql): Promise<void> {
  await sql`ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS chat_snippet TEXT`;
  await sql`ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS chat_snapshot_json TEXT`;
}

type ListRow = {
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

export async function GET(req: Request) {
  const deny = requireAdminSession(req);
  if (deny) return deny;

  const sql = await getSql();
  if (!sql) {
    return NextResponse.json({ rows: [], source: "none" as const });
  }

  await ensureUserReportsChatColumns(sql);

  const url = new URL(req.url);
  const idParam = url.searchParams.get("id");
  if (idParam) {
    const id = Number.parseInt(idParam, 10);
    if (!Number.isFinite(id) || id < 1) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    const rows = (await sql`
      SELECT
        id::text,
        created_at::text,
        reporter_id,
        reported_id,
        reason,
        comments,
        context_chat_id,
        severity,
        auto_scan_hit_count,
        chat_snippet,
        chat_snapshot_json
      FROM user_reports
      WHERE id = ${id} AND context_chat_id IS NOT NULL
      LIMIT 1
    `) as unknown as Array<
      ListRow & { chat_snapshot_json: string | null }
    >;
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ row, source: "database" as const });
  }

  const rows = (await sql`
    SELECT
      id::text,
      created_at::text,
      reporter_id,
      reported_id,
      reason,
      comments,
      context_chat_id,
      severity,
      auto_scan_hit_count,
      chat_snippet
    FROM user_reports
    WHERE context_chat_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 200
  `) as unknown as ListRow[];

  return NextResponse.json({ rows, source: "database" as const });
}
