import { LoginScreen } from "@/components/auth/LoginScreen";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-obsidian text-sm text-zinc-500">
          Cargando…
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
