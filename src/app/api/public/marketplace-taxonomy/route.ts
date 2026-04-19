import { NextResponse } from "next/server";
import { getMarketplaceTaxonomy } from "@/lib/marketplaceTaxonomyStore";

export const runtime = "nodejs";

export async function GET() {
  const payload = await getMarketplaceTaxonomy();
  return NextResponse.json(payload);
}
