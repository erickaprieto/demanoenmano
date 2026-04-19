"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GalleryHorizontal,
  MessageCircle,
  Search,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", icon: GalleryHorizontal },
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/carrito", label: "Carrito", icon: ShoppingBag },
  { href: "/vender", label: "Vender", icon: Store },
  { href: "/mensajes", label: "Mensajes", icon: MessageCircle },
  { href: "/perfil", label: "Perfil", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center"
      aria-label="Navegación principal"
    >
      <div
        className="pointer-events-auto mx-auto w-full max-w-md border-t border-white/[0.08] bg-obsidian/90 px-1 pt-1 backdrop-blur-xl supports-[backdrop-filter]:bg-obsidian/75"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <ul className="flex items-stretch justify-between gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <li key={href} className="min-w-0 flex-1">
                <Link
                  href={href}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium tracking-wide transition-colors ${
                    active
                      ? "text-violet-electric"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon
                    className="size-5 shrink-0"
                    strokeWidth={active ? 2.25 : 1.75}
                    aria-hidden
                  />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
