import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import {
  listAdminProductActivity,
  type AdminProductActivityType,
} from "@/lib/admin/store";

export const runtime = "nodejs";

function parseWindowHours(raw: string | null): number {
  if (!raw) return 24;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return 24;
  return Math.max(1, Math.min(24 * 30, n));
}

function parseActivityType(raw: string | null): "all" | AdminProductActivityType {
  if (raw === "new" || raw === "reported" || raw === "disabled") return raw;
  return "all";
}

export async function GET(req: Request) {
  const deny = requireAdminSession(req);
  if (deny) return deny;

  const url = new URL(req.url);
  const windowHours = parseWindowHours(url.searchParams.get("windowHours"));
  const activityType = parseActivityType(url.searchParams.get("activityType"));

  const data = await listAdminProductActivity({ windowHours, activityType });
  return NextResponse.json({
    rows: data.rows,
    metrics: data.metrics,
    filters: { windowHours, activityType },
  });
}
