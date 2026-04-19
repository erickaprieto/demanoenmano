import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { listAdminTaxonomy } from "@/lib/marketplaceTaxonomyStore";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const deny = requireAdminSession(req);
  if (deny) return deny;
  const data = await listAdminTaxonomy();
  return NextResponse.json(data);
}
