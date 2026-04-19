import { AjustesClient } from "@/components/perfil/AjustesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ajustes y privacidad",
};

export default function AjustesPage() {
  return <AjustesClient />;
}
