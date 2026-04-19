"use client";

import { readHiddenSellerIdsFromStorage } from "@/lib/moderationShadowBan";
import { getSoldListingIdSet } from "@/lib/soldListings";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SWIPE_PRODUCTS, type SwipeProduct } from "@/data/swipeProducts";
import { ProductDetailOverlay } from "./ProductDetailOverlay";
import { SwipeCard } from "./SwipeCard";
import {
  addFavoriteListingId,
  getFavoriteListingIds,
} from "@/lib/favoritesListings";

const DECK_VISIBLE = 3;

function visibleProductsFromStorage(): SwipeProduct[] {
  const hidden = new Set(readHiddenSellerIdsFromStorage());
  const sold = getSoldListingIdSet();
  return SWIPE_PRODUCTS.filter(
    (p) => !hidden.has(p.sellerUserId ?? "") && !sold.has(p.id),
  );
}

export function SwipeDeck() {
  const [queue, setQueue] = useState<SwipeProduct[]>(SWIPE_PRODUCTS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [detail, setDetail] = useState<SwipeProduct | null>(null);
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sync = () => {
      const hidden = new Set(readHiddenSellerIdsFromStorage());
      const sold = getSoldListingIdSet();
      setQueue(
        SWIPE_PRODUCTS.filter(
          (p) =>
            !hidden.has(p.sellerUserId ?? "") &&
            !sold.has(p.id) &&
            !disabledIds.has(p.id),
        ),
      );
      setDetail((d) => {
        if (!d) return d;
        if (
          hidden.has(d.sellerUserId ?? "") ||
          sold.has(d.id) ||
          disabledIds.has(d.id)
        ) {
          return null;
        }
        return d;
      });
    };
    sync();
    window.addEventListener("vibe-shadow-ban-updated", sync);
    window.addEventListener("vibe-sold-listings-updated", sync);
    return () => {
      window.removeEventListener("vibe-shadow-ban-updated", sync);
      window.removeEventListener("vibe-sold-listings-updated", sync);
    };
  }, [disabledIds]);

  useEffect(() => {
    const loadDisabled = async () => {
      try {
        const res = await fetch("/api/public/listings/disabled");
        const data = (await res.json().catch(() => ({}))) as { listingIds?: string[] };
        if (!res.ok || !Array.isArray(data.listingIds)) return;
        setDisabledIds(new Set(data.listingIds));
      } catch {
        /* ignore */
      }
    };
    void loadDisabled();
    const id = window.setInterval(() => void loadDisabled(), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const syncFavorites = () => setFavorites(getFavoriteListingIds());
    syncFavorites();
    window.addEventListener("vibe-favorites-updated", syncFavorites);
    return () =>
      window.removeEventListener("vibe-favorites-updated", syncFavorites);
  }, []);

  const deckSlice = useMemo(
    () => queue.slice(0, Math.min(DECK_VISIBLE, queue.length)),
    [queue],
  );

  const handleSwipeComplete = useCallback(
    (direction: "left" | "right", topId: string) => {
      setQueue((prev) => {
        if (prev.length === 0 || prev[0].id !== topId) return prev;
        const [, ...rest] = prev;
        return rest;
      });

      if (direction === "right") {
        addFavoriteListingId(topId);
      }
    },
    [],
  );

  const resetDeck = useCallback(() => {
    setQueue(visibleProductsFromStorage());
    setDetail(null);
  }, []);

  const paintOrder = useMemo(() => [...deckSlice].reverse(), [deckSlice]);

  const soldSet = getSoldListingIdSet();
  const favoriteProducts = useMemo(
    () =>
      favorites
        .map((id) => SWIPE_PRODUCTS.find((p) => p.id === id))
        .filter((p): p is SwipeProduct => Boolean(p)),
    [favorites],
  );

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-4 flex w-full max-w-md items-center justify-between gap-3 px-1 text-xs text-zinc-500">
        <span>
          Favoritos:{" "}
          <span className="font-semibold text-violet-electric">
            {favorites.length}
          </span>
        </span>
        <span className="tabular-nums text-right">
          {queue.length === 1
            ? "1 artículo en el feed"
            : `${queue.length} artículos en el feed`}
        </span>
      </div>

      <div className="relative h-[min(72dvh,520px)] w-full max-w-[320px]">
        {paintOrder.map((product, paintIdx) => {
          const stackDepth = deckSlice.length - 1 - paintIdx;
          const isTop = stackDepth === 0;

          return (
            <SwipeCard
              key={product.id}
              product={product}
              stackDepth={stackDepth}
              isTop={isTop}
              onOpenDetail={setDetail}
              onSwipeComplete={(dir) => handleSwipeComplete(dir, product.id)}
            />
          );
        })}

        {queue.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-obsidian-elevated px-6 text-center ring-1 ring-white/10">
            <p className="text-sm text-zinc-400">No hay más prendas en el feed.</p>
            <button
              type="button"
              onClick={resetDeck}
              className="mt-5 rounded-2xl bg-violet-electric px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Reiniciar demo
            </button>
          </div>
        ) : null}
      </div>

      {favoriteProducts.length > 0 ? (
        <section className="mt-4 w-full max-w-md rounded-2xl border border-white/[0.06] bg-obsidian-elevated/70 p-3 ring-1 ring-white/[0.04]">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Tus favoritos
          </p>
          <ul className="space-y-2">
            {favoriteProducts.map((p) => {
              const sold = soldSet.has(p.id);
              const disabled = disabledIds.has(p.id);
              return (
                <li
                  key={`fav-${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#1A1A1A] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-200">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">Talla {p.size}</p>
                  </div>
                  {sold || disabled ? (
                    <span className="rounded-full border border-red-400/35 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-200">
                      {sold ? "Vendida" : "Deshabilitada"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDetail(p)}
                      className="rounded-full border border-violet-electric/45 px-2.5 py-1 text-[10px] font-semibold text-violet-100 transition hover:bg-violet-electric/20"
                    >
                      Ver
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <p className="mt-5 max-w-xs text-center text-xs text-zinc-500">
        Desliza a la derecha para guardar en favoritos, a la izquierda para pasar. Toca la tarjeta
        para ver los detalles del producto.
      </p>

      <ProductDetailOverlay product={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
