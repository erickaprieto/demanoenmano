import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/api/admin/_lib";
import { listAdminUsers } from "@/lib/admin/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const deny = requireAdminSession(req);
  if (deny) return deny;
  const users = await listAdminUsers();
  return NextResponse.json({ users });
}
