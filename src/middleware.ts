import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) return NextResponse.next();
    if (!request.cookies.get("vibe_admin_session")?.value) {
      const u = request.nextUrl.clone();
      u.pathname = "/admin/login";
      u.search = "";
      return NextResponse.redirect(u);
    }
    return NextResponse.next();
  }
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.get("vibe_permaban")?.value === "1") {
    const u = request.nextUrl.clone();
    u.pathname = "/bienvenida";
    u.searchParams.set("suspension", "perm");
    return NextResponse.redirect(u);
  }

  const tb = request.cookies.get("vibe_temp_ban_until")?.value;
  let tempBanActive = false;
  if (tb) {
    const ms = new Date(tb).getTime();
    if (Number.isFinite(ms) && Date.now() < ms) tempBanActive = true;
  }
  if (tempBanActive) {
    const u = request.nextUrl.clone();
    u.pathname = "/bienvenida";
    u.searchParams.set("suspension", "temp");
    return NextResponse.redirect(u);
  }

  const res = NextResponse.next();
  if (tb) {
    const ms = new Date(tb).getTime();
    if (Number.isFinite(ms) && Date.now() >= ms) {
      res.cookies.delete("vibe_temp_ban_until");
    }
  }

  if (request.cookies.get("vibe_accepted_terms")?.value !== "1") {
    /** Flujo demo de registro + datos Correos (UI) sin cookie de términos. */
    if (
      pathname.startsWith("/registro") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/recuperar")
    ) {
      return res;
    }
    const u = request.nextUrl.clone();
    u.pathname = "/bienvenida";
    u.search = "";
    return NextResponse.redirect(u);
  }

  const requiresAuth =
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/mensajes") ||
    pathname.startsWith("/vender") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/carrito");
  if (requiresAuth && !request.cookies.get("vibe_session")?.value) {
    const u = request.nextUrl.clone();
    u.pathname = "/login";
    u.searchParams.set("next", pathname);
    return NextResponse.redirect(u);
  }

  return res;
}

export const config = {
  matcher: [
    "/",
    "/((?!bienvenida|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
