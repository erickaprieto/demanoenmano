import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { listSellerVerificationRequests } from "@/lib/sellerVerification";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const deny = requireAdminSession(req);
  if (deny) return deny;
  const rows = await listSellerVerificationRequests();
  return NextResponse.json({ rows });
}
