import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PerfilSubLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export function PerfilSubLayout({ title, children }: PerfilSubLayoutProps) {
  return (
    <div className="px-4 pb-28 pt-4">
      <Link
        href="/perfil"
        className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Volver al perfil
      </Link>
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-white">
        {title}
      </h1>
      {children}
    </div>
  );
}
