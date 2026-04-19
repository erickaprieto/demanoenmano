import { AppLogo } from "@/components/branding/AppLogo";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio",
};

export default function SwipeHomePage() {
  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col px-4 pt-6">
      <header className="mb-4 flex flex-col items-center text-center">
        <AppLogo size={88} priority className="drop-shadow-[0_0_24px_rgba(138,43,226,0.35)]" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
          Descubre en un swipe
        </h1>
        <p className="mt-1.5 text-xs text-zinc-500">
          Marketplace de segunda mano en Costa Rica
        </p>
      </header>

      <section className="flex flex-1 flex-col items-center pb-2">
        <SwipeDeck />
      </section>
    </div>
  );
}
