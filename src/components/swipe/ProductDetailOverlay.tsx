"use client";

import { textWithBrandItalic } from "@/components/branding/BrandName";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { SwipeProduct } from "@/data/swipeProducts";
import { buildCheckoutHrefFromSwipeProduct } from "@/lib/checkoutListing";
import { formatPrecioCRC } from "@/lib/formatColones";
import { ReportUserSheet } from "@/components/reporting/ReportUserSheet";
import { SellerVerificationSection } from "./SellerVerificationSection";
import {
  getSoldListingIdSet,
  markListingSold,
} from "@/lib/soldListings";

type ProductDetailOverlayProps = {
  product: SwipeProduct | null;
  onClose: () => void;
};

export function ProductDetailOverlay({
  product,
  onClose,
}: ProductDetailOverlayProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [isSold, setIsSold] = useState(false);

  useEffect(() => {
    if (!product) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReportOpen(false);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [product, onClose]);

  useEffect(() => {
    if (product) return;
    queueMicrotask(() => setReportOpen(false));
  }, [product]);

  useEffect(() => {
    const sync = () => {
      if (!product) {
        setIsSold(false);
        return;
      }
      setIsSold(getSoldListingIdSet().has(product.id));
    };
    sync();
    window.addEventListener("vibe-sold-listings-updated", sync);
    return () => window.removeEventListener("vibe-sold-listings-updated", sync);
  }, [product]);

  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          key={product.id}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`detail-title-${product.id}`}
          className="fixed inset-0 z-[70] flex flex-col bg-obsidian"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <ReportUserSheet
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            reportedId={product.sellerUserId ?? `seller_${product.id}`}
            reportedDisplayName={
              product.sellerDisplayName ?? "Vendedor verificado"
            }
          />
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="min-w-0">
              <h2
                id={`detail-title-${product.id}`}
                className="truncate text-base font-semibold text-white"
              >
                {product.name}
              </h2>
              <p className="text-sm text-zinc-500">Talla {product.size}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setReportOpen(false);
                onClose();
              }}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Cerrar detalle"
            >
              <X className="size-5" strokeWidth={2} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-violet-electric">
              5 fotos del producto
            </p>

            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {product.images.map((src, index) => (
                <figure
                  key={`${product.id}-img-${index}`}
                  className="relative aspect-[3/4] w-[min(100%,280px)] shrink-0 snap-center overflow-hidden rounded-2xl bg-obsidian-elevated ring-1 ring-white/10"
                >
                  <Image
                    src={src}
                    alt={`${product.name} — foto ${index + 1} de 5`}
                    fill
                    className="object-cover"
                    sizes="280px"
                    priority={index === 0}
                  />
                  <figcaption className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-zinc-200">
                    {index + 1}/5
                  </figcaption>
                </figure>
              ))}
            </div>

            <p className="mt-5 font-mono text-3xl font-bold tabular-nums text-neon-green">
              {formatPrecioCRC(product.priceColones)}
            </p>

            <section
              className="mt-5 rounded-2xl border border-white/[0.06] bg-obsidian-elevated/70 p-4 ring-1 ring-white/[0.04]"
              aria-label="Perfil del vendedor"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                Vendedor
              </p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {product.sellerDisplayName ?? "Vendedor verificado"}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-600">
                    {product.sellerUserId ?? `seller_${product.id}`}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-neon-green/50 bg-neon-green/10 px-2.5 py-1 text-[11px] font-semibold text-neon-green shadow-[0_0_22px_-8px_rgba(57,255,20,0.95)]">
                    <BadgeCheck className="size-3.5" strokeWidth={2.2} aria-hidden />
                    {textWithBrandItalic("Vendedor verificado en De Mano en Mano")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="shrink-0 text-xs font-semibold tracking-tight underline-offset-2 transition hover:underline"
                  style={{ color: "#FF4B4B" }}
                >
                  Reportar
                </button>
              </div>
            </section>

            <p className="mt-4 text-sm text-zinc-500">
              Desliza las fotos horizontalmente. Cierra con la X o Escape.
            </p>

            {product.ficha_tecnica &&
            Object.keys(product.ficha_tecnica).length > 0 ? (
              <SellerVerificationSection
                categoryId={product.categoryId ?? "moda"}
                ficha={product.ficha_tecnica}
              />
            ) : null}

            <div className="mt-8 border-t border-white/[0.08] pt-6">
              {isSold ? (
                <span className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-zinc-800 py-3.5 text-sm font-semibold text-zinc-300">
                  Vendida
                </span>
              ) : (
                <Link
                  href={buildCheckoutHrefFromSwipeProduct(product)}
                  className="flex w-full items-center justify-center rounded-2xl bg-neon-green py-3.5 text-sm font-semibold text-[#0d0d0d] shadow-[0_0_28px_-4px_rgba(57,255,20,0.45)] transition hover:brightness-110"
                >
                  {textWithBrandItalic("Comprar con De Mano en Mano")}
                </Link>
              )}
              {!isSold ? (
                <button
                  type="button"
                  onClick={() =>
                    markListingSold({
                      listingId: product.id,
                      sellerUserId: product.sellerUserId ?? `seller_${product.id}`,
                      title: product.name,
                    })
                  }
                  className="mt-2 flex w-full items-center justify-center rounded-2xl border border-violet-electric/40 bg-violet-electric/10 py-2.5 text-xs font-semibold text-violet-100 transition hover:bg-violet-electric/20"
                >
                  Marcar como vendida (vendedor)
                </button>
              ) : null}
              <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-600">
                El pago queda en custodia hasta que el vendedor registre la guía en
                la app; después podés valorar cuando recibas el paquete.
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
