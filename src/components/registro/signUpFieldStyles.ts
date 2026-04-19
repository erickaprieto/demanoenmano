import type { CSSProperties } from "react";

/** Inputs estilo cyber: borde violeta fino → glow neón al foco. */
export const signUpFieldClass =
  "w-full rounded-xl border border-violet-electric/40 bg-[#0c0c0f]/95 px-3.5 py-3 text-sm text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-zinc-600 focus:border-neon-green focus:shadow-[0_0_0_1px_rgba(51,255,0,0.45),0_0_28px_-8px_rgba(51,255,0,0.25)]";

export const signUpSelectClass = `${signUpFieldClass} appearance-none cursor-pointer bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-11`;

/** Resalta errores de formato en Fucsia Neón. */
export const signUpFieldInvalidClass =
  "border-[#ff00ff] shadow-[0_0_0_1px_rgba(255,0,255,0.6),0_0_24px_-8px_rgba(255,0,255,0.8)] focus:border-[#ff00ff] focus:shadow-[0_0_0_1px_rgba(255,0,255,0.8),0_0_28px_-8px_rgba(255,0,255,0.95)]";

export const selectChevronStyle: CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23a78bfa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
};
