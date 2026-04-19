"use client";

import Link from "next/link";
import { PerfilSubLayout } from "./PerfilSubLayout";

export function AjustesClient() {
  return (
    <PerfilSubLayout title="Ajustes y privacidad">
      <div className="space-y-6">
        <section className="rounded-2xl border border-white/[0.06] bg-obsidian-elevated/60 p-4 ring-1 ring-white/[0.04]">
          <h2 className="text-sm font-semibold text-white">Envío y cuenta</h2>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Los datos de entrega se guardan en tu dispositivo (demo) y se usan
            solo para operaciones con Correos. Podés actualizarlos cuando quieras.
          </p>
          <Link
            href="/perfil/datos-envio"
            className="mt-3 inline-flex rounded-xl bg-violet-electric/20 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-electric/30"
          >
            Datos de envío
          </Link>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-obsidian-elevated/60 p-4 ring-1 ring-white/[0.04]">
          <h2 className="text-sm font-semibold text-white">Privacidad en el chat</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-xs leading-relaxed text-zinc-400">
            <li>
              No compartas teléfonos ni correos en mensajes: usá el flujo de compra
              y la guía de Correos dentro de De Mano en Mano.
            </li>
            <li>
              El comprador no ve tu contacto personal; el vendedor tampoco ve el
              del comprador: solo etiquetas y estado del envío.
            </li>
            <li>
              Los retiros SINPE se solicitan desde tu perfil con datos verificados
              (en producción).
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-obsidian-elevated/60 p-4 ring-1 ring-white/[0.04]">
          <h2 className="text-sm font-semibold text-white">Notificaciones (demo)</h2>
          <p className="mt-2 text-xs text-zinc-500">
            Próximamente: preferencias de push y correo.
          </p>
        </section>
      </div>
    </PerfilSubLayout>
  );
}
