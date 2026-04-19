import { NextResponse } from "next/server";
import { listDisabledListingIds } from "@/lib/admin/store";

export const runtime = "nodejs";

export async function GET() {
  const listingIds = await listDisabledListingIds();
  return NextResponse.json({ listingIds });
}
