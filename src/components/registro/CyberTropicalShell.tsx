import type { ReactNode } from "react";
import { GradientBackdrop } from "@/components/ui/GradientBackdrop";

/**
 * Fondo cyber-tropical: obsidiana profunda + halos violeta fluidos (vector-style, sin raster).
 */
export function CyberTropicalShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#060608] text-zinc-100">
      <GradientBackdrop />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        {children}
      </div>
    </div>
  );
}
