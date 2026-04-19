import { VentasClient } from "@/components/perfil/VentasClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis ventas",
};

export default function VentasPage() {
  return <VentasClient />;
}
