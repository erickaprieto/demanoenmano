import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Registro",
  description: "Únete a De Mano en Mano — registro y datos de envío Correos (demo UI).",
};

export default function RegistroLayout({ children }: { children: ReactNode }) {
  return children;
}
