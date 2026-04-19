"use client";

import { textWithBrandItalic } from "@/components/branding/BrandName";
import Link from "next/link";
import { PerfilSubLayout } from "./PerfilSubLayout";

const faqs = [
  {
    q: "¿Cómo recibo el envío sin dar mi teléfono en el chat?",
    a: "Completá «Datos de envío» en tu perfil (o antes de tu primera compra). De Mano en Mano usa esa información solo para Correos. El vendedor registra la guía en «Mis ventas» y vos la ves en «Mis compras» y en el rastreo oficial.",
  },
  {
    q: "¿Cuándo debe el vendedor poner el número de guía?",
    a: "Después de dejar el paquete en Correos. En «Mis ventas» ingresa el número de guía en De Mano en Mano: es el paso que dispara la liberación del pago al vendedor (pago seguro De Mano en Mano) y permite al comprador rastrear sin intercambiar contactos.",
  },
  {
    q: "¿Por qué pedir datos de envío al crear el perfil o antes de comprar?",
    a: "Así la etiqueta y los avisos de Correos quedan listos sin filtrar datos sensibles por el chat. En esta demo todo queda guardado localmente en tu navegador.",
  },
  {
    q: "¿Qué pasa si intento compartir WhatsApp o SINPE en el chat?",
    a: "De Mano en Mano bloquea mensajes con datos de contacto o pagos por fuera para proteger tu dinero. Mantené la conversación y el pago dentro de la app.",
  },
];

export function AyudaClient() {
  return (
    <PerfilSubLayout title="Ayuda y soporte">
      <p className="mb-6 text-sm text-zinc-500">
        Respuestas rápidas sobre envíos, privacidad y guías. Para incidencias
        reales contactá soporte en producción.
      </p>
      <div className="mb-8 rounded-2xl border border-violet-electric/25 bg-violet-electric/10 p-4">
        <p className="text-sm font-medium text-white">¿Necesitás datos de envío?</p>
        <Link
          href="/perfil/datos-envio"
          className="mt-2 inline-block text-sm font-semibold text-violet-200 underline-offset-2 hover:underline"
        >
          Ir a datos de envío
        </Link>
      </div>
      <ul className="space-y-5">
        {faqs.map((item, i) => (
          <li
            key={i}
            className="rounded-2xl border border-white/[0.06] bg-obsidian-elevated/70 p-4 ring-1 ring-white/[0.04]"
          >
            <p className="text-sm font-semibold text-white">{item.q}</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              {textWithBrandItalic(item.a)}
            </p>
          </li>
        ))}
      </ul>
    </PerfilSubLayout>
  );
}
