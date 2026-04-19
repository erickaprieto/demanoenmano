import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { listPayoutReleaseQueue } from "@/lib/payoutReleaseStore";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const deny = requireAdminSession(req);
  if (deny) return deny;
  const rows = await listPayoutReleaseQueue();
  return NextResponse.json({ rows });
}
