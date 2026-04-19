import { RecoverPasswordScreen } from "@/components/auth/RecoverPasswordScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

export default function RecoverPage() {
  return <RecoverPasswordScreen />;
}
