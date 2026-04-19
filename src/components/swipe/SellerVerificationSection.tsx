"use client";

import {
  getQuestionsForCategory,
  isPositiveAnswer,
  type FichaTecnicaV1,
  type VendorQuestion,
} from "@/data/vendorVerificationQuestionnaire";
import {
  buildStaticTaxonomy,
  type MarketplaceTaxonomyPayload,
} from "@/lib/marketplaceTaxonomyStatic";
import { AlertCircle, Check, CircleDot, Minus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function labelForValue(q: VendorQuestion, raw: string): string {
  if (q.kind === "tags") return raw;
  return raw === "yes" ? "Sí" : raw === "no" ? "No" : "—";
}

type Props = {
  categoryId: string;
  ficha: FichaTecnicaV1;
};

export function SellerVerificationSection({ categoryId, ficha }: Props) {
  const [taxonomy, setTaxonomy] = useState<MarketplaceTaxonomyPayload | null>(null);
  useEffect(() => {
    void fetch("/api/public/marketplace-taxonomy")
      .then((r) => r.json())
      .then((d: MarketplaceTaxonomyPayload) => setTaxonomy(d))
      .catch(() => setTaxonomy(buildStaticTaxonomy()));
  }, []);

  const taxonomySafe = taxonomy ?? buildStaticTaxonomy();
  const questions = useMemo(() => {
    const dyn = taxonomySafe.attributesByCategory[categoryId];
    if (dyn && dyn.length > 0) return dyn;
    return getQuestionsForCategory(categoryId);
  }, [taxonomySafe, categoryId]);

  if (questions.length === 0) return null;

  return (
    <section
      className="mt-8 rounded-2xl border border-white/[0.08] p-4 ring-1 ring-white/[0.04]"
      style={{ backgroundColor: "#1A1A1A" }}
      aria-labelledby="seller-verify-heading"
    >
      <h3
        id="seller-verify-heading"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500"
      >
        Verificación del vendedor
      </h3>
      <ul className="mt-4 space-y-3">
        {questions.map((q) => {
          const raw = ficha[q.id] ?? "";
          const answered = raw === "yes" || raw === "no" || Boolean(raw);
          const tagAnswered = q.kind === "tags" && Boolean(raw);
          const positive =
            answered && q.kind === "yesno" && isPositiveAnswer(q, raw);
          const neutralDeclared =
            answered && q.goodAnswer == null && q.kind === "yesno";
          const negativeDeclared =
            answered &&
            q.kind === "yesno" &&
            q.goodAnswer != null &&
            !positive &&
            (raw === "yes" || raw === "no");

          return (
            <li
              key={q.id}
              className="flex gap-3 rounded-xl border border-white/[0.06] bg-[#242424]/80 px-3 py-2.5"
            >
              <span className="mt-0.5 shrink-0">
                {!answered ? (
                  <Minus className="size-4 text-zinc-600" strokeWidth={2} />
                ) : tagAnswered ? (
                  <Check
                    className="size-4 text-violet-electric"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                ) : positive ? (
                  <Check
                    className="size-4 text-neon-green"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                ) : neutralDeclared ? (
                  <CircleDot
                    className="size-4 text-zinc-400"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : negativeDeclared ? (
                  <AlertCircle
                    className="size-4 text-amber-500/90"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : (
                  <Check
                    className="size-4 text-zinc-500"
                    strokeWidth={2}
                    aria-hidden
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium leading-snug text-zinc-400">
                  {q.label}
                </p>
                <p
                  className={`mt-0.5 text-sm font-semibold ${
                    positive
                      ? "text-neon-green"
                      : tagAnswered
                        ? "text-zinc-100"
                        : answered
                          ? "text-zinc-200"
                          : "text-zinc-600"
                  }`}
                >
                  {answered ? labelForValue(q, raw) : "Sin declarar"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
