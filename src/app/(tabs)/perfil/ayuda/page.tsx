import { AyudaClient } from "@/components/perfil/AyudaClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ayuda y soporte",
};

export default function AyudaPage() {
  return <AyudaClient />;
}
