import { AppLogo } from "@/components/branding/AppLogo";
import { SellerKycGate } from "@/components/vender/SellerKycGate";
import { UploadProductForm } from "@/components/vender/UploadProductForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vender",
};

export default function VenderPage() {
  return (
    <div className="px-4 pt-6">
      <header className="mb-6 flex items-start gap-3">
        <AppLogo size={52} className="shrink-0 drop-shadow-[0_0_16px_rgba(138,43,226,0.25)]" />
        <div className="min-w-0 pt-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Subir producto
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Completá los datos. Las cinco fotos son obligatorias para publicar.
          </p>
        </div>
      </header>

      <SellerKycGate>
        <UploadProductForm />
      </SellerKycGate>
    </div>
  );
}
