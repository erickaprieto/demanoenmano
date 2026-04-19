import { textWithBrandItalic } from "@/components/branding/BrandName";
import { LEGAL_TERMS_DE_MANO_EN_MANO_CR } from "@/content/legalTermsReVibeCr";

export function TermsScroll() {
  return (
    <section
      aria-labelledby="legal-terms-heading"
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414] ring-1 ring-white/[0.04]"
    >
      <h2
        id="legal-terms-heading"
        className="shrink-0 border-b border-white/[0.06] px-4 py-3 text-sm font-semibold text-white"
      >
        Términos y condiciones
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4">
        <pre
          className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-zinc-300"
          style={{ fontFamily: "var(--font-inter), ui-sans-serif, system-ui" }}
        >
          {textWithBrandItalic(LEGAL_TERMS_DE_MANO_EN_MANO_CR)}
        </pre>
      </div>
    </section>
  );
}
