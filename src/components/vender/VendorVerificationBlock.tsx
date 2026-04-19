"use client";

import type { FichaTecnicaV1 } from "@/data/vendorVerificationQuestionnaire";
import {
  getQuestionsForCategory,
  type VendorQuestion,
} from "@/data/vendorVerificationQuestionnaire";

type Props = {
  categoryId: string;
  value: FichaTecnicaV1;
  onChange: (next: FichaTecnicaV1) => void;
  error?: string;
  /** Si viene de la taxonomía dinámica (admin/DB), tiene prioridad sobre el catálogo embebido. */
  questionsOverride?: VendorQuestion[] | null;
};

export function VendorVerificationBlock({
  categoryId,
  value,
  onChange,
  error,
  questionsOverride,
}: Props) {
  const questions =
    questionsOverride && questionsOverride.length > 0
      ? questionsOverride
      : getQuestionsForCategory(categoryId);

  return (
    <div
      className="space-y-4 rounded-2xl border border-white/[0.08] p-4 ring-1 ring-white/[0.04]"
      style={{ backgroundColor: "#1A1A1A" }}
    >
      <div>
        <h2 className="text-sm font-semibold text-white">
          Verificación del vendedor
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Respondé cada punto según tu artículo. Es obligatorio para publicar y
          queda guardado en la ficha técnica del producto.
        </p>
      </div>

      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="space-y-5">
        {questions.map((q) => (
          <li key={q.id}>
            <p className="text-xs font-medium leading-snug text-zinc-300">
              {q.label}
            </p>
            {q.kind === "yesno" ? (
              <div className="mt-2 flex gap-2">
                {(["yes", "no"] as const).map((opt) => {
                  const active = value[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...value,
                          [q.id]: opt,
                        })
                      }
                      className={`min-h-10 flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-violet-electric bg-violet-electric text-white shadow-[0_0_20px_-8px_rgba(138,43,226,0.45)]"
                          : "border-white/10 bg-[#242424] text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      {opt === "yes" ? "Sí" : "No"}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {(q.options ?? []).map((tag) => {
                  const active = value[q.id] === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...value,
                          [q.id]: tag,
                        })
                      }
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-violet-electric bg-violet-electric text-white"
                          : "border-white/10 bg-[#242424] text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
