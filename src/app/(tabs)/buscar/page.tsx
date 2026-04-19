import { BuscarClient } from "@/components/buscar/BuscarClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar",
};

export default function BuscarPage() {
  return <BuscarClient />;
}
