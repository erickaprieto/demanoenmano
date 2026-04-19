import { ComprasClient } from "@/components/perfil/ComprasClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis compras",
};

export default function ComprasPage() {
  return <ComprasClient />;
}
