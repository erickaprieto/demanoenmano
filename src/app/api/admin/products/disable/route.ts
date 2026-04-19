import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { setListingDisabled } from "@/lib/admin/store";
import { isSafeId, requireTrustedOrigin, sanitizeText } from "@/lib/apiSecurity";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const deny = requireAdminSession(req);
  if (deny) return deny;
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  let body: { listingId?: string; disabled?: boolean; reason?: string | null };
  try {
    body = (await req.json()) as { listingId?: string; disabled?: boolean; reason?: string | null };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const listingId = sanitizeText(body.listingId, 80);
  const disabled = Boolean(body.disabled);
  const reason = body.reason == null ? null : sanitizeText(body.reason, 200);
  if (!listingId || !isSafeId(listingId)) {
    return NextResponse.json({ error: "listingId inválido" }, { status: 400 });
  }
  await setListingDisabled({ listingId, disabled, reason });
  return NextResponse.json({ ok: true });
}
