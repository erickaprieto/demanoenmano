import { MessagesClient } from "@/components/chat/MessagesClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Mensajes",
};

export default function MensajesPage() {
  return (
    <div className="flex min-h-0 flex-col px-4 pt-6">
      <header className="mb-4 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Mis mensajes
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Chateá con compradores y vendedores. Los envíos se sincronizan entre
          pestañas en esta demo.
        </p>
      </header>

      <Suspense
        fallback={
          <p className="py-8 text-center text-sm text-zinc-500">
            Cargando mensajes…
          </p>
        }
      >
        <MessagesClient />
      </Suspense>
    </div>
  );
}
