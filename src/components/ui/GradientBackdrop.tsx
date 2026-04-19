/**
 * Halos violeta fluidos sobre obsidiana profunda (reutilizable en carrito, registro, etc.).
 */
export function GradientBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-90"
      aria-hidden
    >
      <div className="absolute -left-[20%] -top-[10%] h-[min(100vw,420px)] w-[min(100vw,420px)] rounded-full bg-gradient-to-br from-violet-electric/25 via-violet-600/10 to-transparent blur-[80px]" />
      <div className="absolute -right-[25%] top-[30%] h-[min(90vw,380px)] w-[min(90vw,380px)] rounded-full bg-gradient-to-tl from-violet-500/20 via-fuchsia-600/10 to-transparent blur-[90px]" />
      <div className="absolute bottom-[-15%] left-[10%] h-[min(85vw,320px)] w-[min(85vw,320px)] rounded-full bg-gradient-to-tr from-violet-electric/15 to-transparent blur-[70px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(138,43,226,0.12),transparent_55%)]" />
    </div>
  );
}
