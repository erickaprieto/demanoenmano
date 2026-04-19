import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { listAdminListings } from "@/lib/admin/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const deny = requireAdminSession(req);
  if (deny) return deny;
  const products = await listAdminListings();
  return NextResponse.json({ products });
}
