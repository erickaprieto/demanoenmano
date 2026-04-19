"use client";

import Image from "next/image";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import type { SwipeProduct } from "@/data/swipeProducts";
import { formatPrecioCRC } from "@/lib/formatColones";

const SWIPE_THRESHOLD = 110;
const VELOCITY_THRESHOLD = 520;

type SwipeCardProps = {
  product: SwipeProduct;
  /** 0 = tarjeta superior (interactiva) */
  stackDepth: number;
  isTop: boolean;
  onSwipeComplete: (direction: "left" | "right") => void;
  onOpenDetail: (product: SwipeProduct) => void;
};

export function SwipeCard({
  product,
  stackDepth,
  isTop,
  onSwipeComplete,
  onOpenDetail,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-16, 16]);
  const likeOpacity = useTransform(x, [24, 96], [0, 1]);
  const passOpacity = useTransform(x, [-96, -24], [1, 0]);

  const scale = 1 - stackDepth * 0.045;
  const translateY = stackDepth * 10;

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isTop) return;

    const offset = info.offset.x;
    const vx = info.velocity.x;

    const goRight = offset > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD;
    const goLeft = offset < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD;

    if (goRight) {
      await animate(x, 720, { duration: 0.28, ease: [0.32, 0.72, 0, 1] });
      onSwipeComplete("right");
      return;
    }
    if (goLeft) {
      await animate(x, -720, { duration: 0.28, ease: [0.32, 0.72, 0, 1] });
      onSwipeComplete("left");
      return;
    }

    await animate(x, 0, { type: "spring", stiffness: 520, damping: 38 });
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        scale,
        y: translateY,
        zIndex: 20 - stackDepth,
      }}
      drag={isTop ? "x" : false}
      dragElastic={0.82}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      onTap={() => {
        if (isTop) onOpenDetail(product);
      }}
      className={`absolute left-1/2 top-0 w-[min(100%,300px)] -translate-x-1/2 ${
        isTop ? "touch-none cursor-grab active:cursor-grabbing" : "pointer-events-none"
      }`}
      role="group"
      aria-label={`${product.name}, talla ${product.size}, ${formatPrecioCRC(product.priceColones)}`}
    >
      <div className="relative aspect-[9/14] w-full overflow-hidden rounded-3xl bg-obsidian-elevated shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/10">
        <Image
          src={product.images[0]}
          alt=""
          fill
          className="object-cover select-none"
          sizes="300px"
          draggable={false}
          priority={isTop}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        <motion.span
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute left-5 top-8 max-w-[min(200px,55%)] rotate-[-12deg] rounded-lg border-4 border-neon-green px-2.5 py-1 text-center text-sm font-black leading-tight tracking-tight text-neon-green sm:text-base"
          aria-hidden
        >
          Me gusta
        </motion.span>
        <motion.span
          style={{ opacity: passOpacity }}
          className="pointer-events-none absolute right-5 top-8 max-w-[min(200px,55%)] rotate-[12deg] rounded-lg border-4 border-zinc-400 px-2.5 py-1 text-center text-sm font-black leading-tight tracking-tight text-zinc-200 sm:text-base"
          aria-hidden
        >
          No me gusta
        </motion.span>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
          <p className="line-clamp-2 text-lg font-semibold leading-snug text-white">
            {product.name}
          </p>
          <p className="mt-1 text-sm text-zinc-400">Talla {product.size}</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight text-neon-green">
            {formatPrecioCRC(product.priceColones)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
