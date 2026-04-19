"use client";

import { Star } from "lucide-react";
import { PerfilSubLayout } from "./PerfilSubLayout";

const reviews = [
  {
    id: "r1",
    author: "Comprador ****82",
    rating: 5,
    text: "Todo perfecto, envío rápido y artículo como en las fotos.",
    date: "Mar 2026",
  },
  {
    id: "r2",
    author: "Comprador ****15",
    rating: 4,
    text: "Buena comunicación por la app. Recomendado.",
    date: "Feb 2026",
  },
  {
    id: "r3",
    author: "Comprador ****40",
    rating: 5,
    text: "Empaque cuidadoso. Volvería a comprar.",
    date: "Ene 2026",
  },
];

export function ResenasClient() {
  return (
    <PerfilSubLayout title="Reseñas">
      <p className="mb-6 text-sm text-zinc-500">
        Opiniones de quienes te compraron en De Mano en Mano (identidades resumidas por
        privacidad).
      </p>
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-white/[0.06] bg-obsidian-elevated/80 p-4 ring-1 ring-white/[0.04]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">{r.author}</p>
              <span className="flex items-center gap-0.5 text-neon-green">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" strokeWidth={0} />
                ))}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{r.text}</p>
            <p className="mt-2 text-[11px] text-zinc-600">{r.date}</p>
          </li>
        ))}
      </ul>
    </PerfilSubLayout>
  );
}
