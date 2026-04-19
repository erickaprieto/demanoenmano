import { ResenasClient } from "@/components/perfil/ResenasClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reseñas",
};

export default function ResenasPage() {
  return <ResenasClient />;
}
