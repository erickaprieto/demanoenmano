import { ProfileScreen } from "@/components/perfil/ProfileScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil",
};

export default function PerfilPage() {
  return <ProfileScreen />;
}
