"use client";

import { AppLogo } from "@/components/branding/AppLogo";
import { GradientBackdrop } from "@/components/ui/GradientBackdrop";
import { formatColones } from "@/lib/formatColones";
import { CircleCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/** Sneaker con tono verde / retro (placeholder tipo image_14). */
const IMG_SNEAKER =
  "https://images.unsplash.com/photo-1608231387042-fe94c97840fc?auto=format&fit=crop&w=400&q=85";
/** Blusa lino — look minimalista. */
const IMG_BLOUSE =
  "https://images.unsplash.com/photo-1598550476439-68477867f259?auto=format&fit=crop&w=400&q=85";

const card =
  "rounded-2xl border border-violet-electric/25 bg-[#0a0a0c]/80 shadow-inner shadow-black/30 ring-1 ring-violet-electric/10 backdrop-blur-sm";

type LineItem = {
  id: string;
  title: string;
  priceColones: number;
  imageSrc: string;
  imageAlt: string;
};

type SellerBlock = {
  id: string;
  sellerName: string;
  province: string;
  shippingColones: number;
  items: LineItem[];
};

const BLOCKS: SellerBlock[] = [
  {
    id: "tiquicia",
    sellerName: "Tiquicia Chic",
    province: "San José",
    shippingColones: 2_500,
    items: [
      {
        id: "sneaker",
        title: "Sneakers Retro Verdes",
        priceColones: 15_000,
        imageSrc: IMG_SNEAKER,
        imageAlt: "Sneakers retro en tonos verdes",
      },
    ],
  },
  {
    id: "comadre",
    sellerName: "La Comadre Shop",
    province: "Puntarenas",
    shippingColones: 3_000,
    items: [
      {
        id: "blusa",
        title: "Blusa de Lino",
        priceColones: 8_000,
        imageSrc: IMG_BLOUSE,
        imageAlt: "Blusa de lino",
      },
    ],
  },
];

const TOTAL_ITEMS = 23_000;
const TOTAL_SHIPPING = 5_500;
const GUIAS = 2;
const GRAND_TOTAL = 28_500;

function ValidationLine() {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-neon-green">
      <CircleCheck className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      <span className="h-px flex-1 max-w-[140px] bg-gradient-to-r from-neon-green/80 to-transparent" />
      <span className="text-neon-green/90">Listo para guía Correos</span>
    </div>
  );
}

export function ShoppingCartScreen() {
  const checkoutHref = `/checkout?precio=${GRAND_TOTAL}&titulo=${encodeURIComponent("Carrito De Mano en Mano")}&peso=1_2kg&categoria=moda`;

  return (
    <div className="relative flex min-h-[calc(100dvh-5.5rem)] flex-col overflow-x-hidden bg-[#060608] px-4 pb-10 pt-6 text-zinc-100">
      <GradientBackdrop />

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex flex-col items-center">
          <AppLogo
            size={72}
            className="drop-shadow-[0_0_28px_rgba(138,43,226,0.4)]"
          />
        </div>

        <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight text-white">
          Tu carrito De Mano en Mano
        </h1>
        <p className="mt-1.5 text-center text-xs text-zinc-500">
          Cada vendedor envía por separado · {GUIAS} guías en este pedido
        </p>

        <div className="mt-8 flex flex-1 flex-col gap-5">
          {BLOCKS.map((block) => (
            <section
              key={block.id}
              className={card}
              aria-labelledby={`cart-block-${block.id}`}
            >
              <p
                id={`cart-block-${block.id}`}
                className="border-b border-violet-electric/20 bg-violet-electric/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-violet-electric"
              >
                De: {block.sellerName}{" "}
                <span className="font-normal normal-case text-violet-200/90">
                  ({block.province})
                </span>
              </p>

              <div className="space-y-4 p-4">
                {block.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10">
                      <Image
                        src={item.imageSrc}
                        alt={item.imageAlt}
                        fill
                        className="object-cover"
                        sizes="72px"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm font-medium leading-snug text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-zinc-200">
                        ₡{formatColones(item.priceColones)}
                      </p>
                      <ValidationLine />
                    </div>
                  </div>
                ))}

                <p className="border-t border-white/[0.06] pt-3 text-sm text-white">
                  <span className="text-zinc-500">Envío (Correos CR):</span>{" "}
                  <span className="font-mono font-semibold tabular-nums">
                    ₡{formatColones(block.shippingColones)}
                  </span>
                </p>
              </div>
            </section>
          ))}
        </div>

        <section
          className={`${card} mt-6 space-y-3 p-4`}
          aria-labelledby="cart-totals-title"
        >
          <h2 id="cart-totals-title" className="sr-only">
            Total del pedido
          </h2>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-zinc-400">Total artículos</span>
            <span className="font-mono font-semibold tabular-nums text-white">
              ₡{formatColones(TOTAL_ITEMS)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-zinc-400">
              Total envíos ({GUIAS} guías)
            </span>
            <span className="font-mono font-semibold tabular-nums text-white">
              ₡{formatColones(TOTAL_SHIPPING)}
            </span>
          </div>
          <div className="border-t border-white/[0.08] pt-3">
            <Link
              href={checkoutHref}
              className="flex w-full items-center justify-center rounded-2xl bg-neon-green py-4 text-center text-base font-bold tracking-tight text-black shadow-[0_0_36px_-6px_rgba(51,255,0,0.55)] transition hover:brightness-110 active:scale-[0.99]"
            >
              Revisar y Pagar ({GUIAS} Guías)
            </Link>
          </div>
        </section>

        <p className="mt-5 text-center text-[10px] leading-relaxed text-zinc-600">
          Demo visual: montos de ejemplo. En producción cada guía se liquida con
          Correos de Costa Rica según peso y destino.
        </p>
      </div>
    </div>
  );
}
