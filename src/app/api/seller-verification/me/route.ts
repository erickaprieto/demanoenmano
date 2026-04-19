import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getSellerVerificationByUser } from "@/lib/sellerVerification";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  const record = await getSellerVerificationByUser(session.userId);
  if (!record) return NextResponse.json({ authenticated: true, status: "not_submitted" });
  return NextResponse.json({
    authenticated: true,
    status: record.status,
    rejectReason: record.rejectReason,
    autoChecks: record.autoChecks,
    reviewedAt: record.reviewedAt,
  });
}
