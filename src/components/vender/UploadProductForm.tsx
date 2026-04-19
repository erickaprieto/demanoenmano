"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Camera, Video } from "lucide-react";
import Link from "next/link";
import { SELL_CATEGORY_OPTIONS, SELL_CATEGORY_OTRO_ID } from "@/data/sellCategories";
import {
  emptyPhotoState,
  emptyPreviewState,
  getPhotoSlotsForCategory,
  PHOTO_SLOT_IDS,
  type PhotoSlotId,
} from "@/data/photoSlotHints";
import { shippingColonesForTier } from "@/lib/checkoutShipping";
import { formatColones } from "@/lib/formatColones";
import {
  buildCheckoutHrefFromDraft,
  savePublishDraft,
  type PublishDraftV1,
} from "@/lib/publishDraft";
import { SellCategorySelector } from "@/components/vender/SellCategorySelector";
import { VendorVerificationBlock } from "@/components/vender/VendorVerificationBlock";
import { PhotoTipsModal } from "@/components/vender/PhotoTipsModal";
import { PublicationTransparencyCalculator } from "@/components/vender/PublicationTransparencyCalculator";
import type { FichaTecnicaV1 } from "@/data/vendorVerificationQuestionnaire";
import {
  getQuestionsForCategory,
  isFichaCompleteForQuestions,
} from "@/data/vendorVerificationQuestionnaire";
import {
  buildStaticTaxonomy,
  type MarketplaceTaxonomyPayload,
} from "@/lib/marketplaceTaxonomyStatic";
import { resolveCategoryLabel } from "@/lib/marketplaceTaxonomyResolve";
import { readPhotoTipsPermanentlyDismissed } from "@/lib/photoTipsPreferences";
import { findBlockedListingTerm } from "@/lib/listingPolicy";

function buildSellCategoryLabel(
  categoryId: string,
  other: string,
  taxonomy: MarketplaceTaxonomyPayload,
): string {
  const base = resolveCategoryLabel(categoryId, taxonomy);
  if (categoryId === SELL_CATEGORY_OTRO_ID && other.trim()) {
    return `${base} · ${other.trim()}`;
  }
  return base;
}

const WEIGHT_OPTIONS = [
  { value: "", label: "Peso aproximado (Correos CR)" },
  { value: "lt_500g", label: "Menos de 500 g" },
  { value: "lt_1kg", label: "Menos de 1 kg" },
  { value: "1_2kg", label: "1 – 2 kg" },
  { value: "2_5kg", label: "2 – 5 kg" },
  { value: "gt_5kg", label: "Más de 5 kg" },
] as const;

type FormErrors = Partial<{
  photos: string;
  title: string;
  description: string;
  sellCategory: string;
  sellOther: string;
  condition: string;
  price: string;
  weight: string;
  ficha: string;
  payoutTerms: string;
}>;

export function UploadProductForm() {
  const formId = useId();
  const [photos, setPhotos] = useState<Record<PhotoSlotId, File | null>>(
    emptyPhotoState,
  );
  const [previews, setPreviews] =
    useState<Record<PhotoSlotId, string | null>>(emptyPreviewState);

  const [sellCategory, setSellCategory] = useState("");
  const [sellOtherText, setSellOtherText] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState(7);
  const [priceColones, setPriceColones] = useState("");
  const [weight, setWeight] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [lastDraft, setLastDraft] = useState<PublishDraftV1 | null>(null);
  const [fichaTecnica, setFichaTecnica] = useState<FichaTecnicaV1>({});
  const [photoTipsOpen, setPhotoTipsOpen] = useState(false);
  const [acceptedPayoutTerms, setAcceptedPayoutTerms] = useState(false);
  const [taxonomy, setTaxonomy] = useState<MarketplaceTaxonomyPayload | null>(null);
  const prevPhotoStepUnlocked = useRef(false);

  const taxonomySafe = taxonomy ?? buildStaticTaxonomy();

  useEffect(() => {
    void fetch("/api/public/marketplace-taxonomy")
      .then((r) => r.json())
      .then((d: MarketplaceTaxonomyPayload) => setTaxonomy(d))
      .catch(() => setTaxonomy(buildStaticTaxonomy()));
  }, []);

  const questionsForSell = useMemo(() => {
    const dyn = taxonomySafe.attributesByCategory[sellCategory];
    if (dyn && dyn.length > 0) return dyn;
    return getQuestionsForCategory(sellCategory);
  }, [taxonomySafe, sellCategory]);

  const previewsRef = useRef(previews);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      PHOTO_SLOT_IDS.forEach((k) => {
        const url = previewsRef.current[k];
        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const revokePreview = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  const clearPhotos = useCallback(() => {
    setPreviews((prev) => {
      PHOTO_SLOT_IDS.forEach((id) => revokePreview(prev[id]));
      return emptyPreviewState();
    });
    setPhotos(emptyPhotoState());
    setErrors((e) => ({ ...e, photos: undefined }));
    setStatus("idle");
  }, [revokePreview]);

  const photoStepUnlocked = useMemo(
    () =>
      Boolean(sellCategory) &&
      (sellCategory !== SELL_CATEGORY_OTRO_ID ||
        sellOtherText.trim().length > 0),
    [sellCategory, sellOtherText],
  );

  const photoSlots = useMemo(
    () => (photoStepUnlocked ? getPhotoSlotsForCategory(sellCategory) : []),
    [photoStepUnlocked, sellCategory],
  );

  const estimatedShippingColones = useMemo(
    () => (weight ? shippingColonesForTier(weight) : null),
    [weight],
  );

  const prevCategoryRef = useRef(sellCategory);
  useEffect(() => {
    if (prevCategoryRef.current === sellCategory) return;
    prevCategoryRef.current = sellCategory;
    queueMicrotask(() => {
      clearPhotos();
      setFichaTecnica({});
    });
  }, [sellCategory, clearPhotos]);

  useEffect(() => {
    if (!photoStepUnlocked) {
      queueMicrotask(() => {
        clearPhotos();
      });
    }
  }, [photoStepUnlocked, clearPhotos]);

  useEffect(() => {
    if (!photoStepUnlocked) {
      prevPhotoStepUnlocked.current = false;
      return;
    }
    const wasUnlocked = prevPhotoStepUnlocked.current;
    prevPhotoStepUnlocked.current = true;
    if (wasUnlocked) return;
    if (typeof window === "undefined") return;
    if (readPhotoTipsPermanentlyDismissed()) return;
    queueMicrotask(() => setPhotoTipsOpen(true));
  }, [photoStepUnlocked]);

  const setPhotoForSlot = useCallback(
    (slot: PhotoSlotId, file: File | null) => {
      setPhotos((p) => ({ ...p, [slot]: file }));
      setPreviews((prev) => {
        const next = { ...prev };
        revokePreview(next[slot]);
        next[slot] = file ? URL.createObjectURL(file) : null;
        return next;
      });
      setErrors((e) => ({ ...e, photos: undefined }));
      setStatus("idle");
    },
    [revokePreview],
  );

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (photoStepUnlocked) {
      const slots = getPhotoSlotsForCategory(sellCategory);
      const missing = slots.filter((s) => !photos[s.id]);
      if (missing.length > 0) {
        next.photos = `Faltan archivos: ${missing.map((m) => m.label).join(", ")}.`;
      } else {
        const badVideo = slots.find(
          (s) =>
            s.media === "video" &&
            photos[s.id] &&
            !photos[s.id]!.type.startsWith("video/"),
        );
        if (badVideo) {
          next.photos = `El cuadro «${badVideo.label}» debe ser un video.`;
        }
      }
    }
    if (!sellCategory) {
      next.sellCategory = "Seleccioná qué vas a vender.";
    }
    if (
      sellCategory === SELL_CATEGORY_OTRO_ID &&
      !sellOtherText.trim()
    ) {
      next.sellOther =
        "Completá este campo para indicar qué tipo de artículo es.";
    }
    const titleTrim = title.trim();
    if (!titleTrim) {
      next.title = "El título es obligatorio.";
    } else if (titleTrim.length < 20) {
      next.title = "El título debe tener al menos 20 caracteres.";
    }
    const descTrim = description.trim();
    if (!descTrim) {
      next.description = "La descripción es obligatoria.";
    } else if (descTrim.length < 300) {
      next.description = `La descripción debe tener al menos 300 caracteres (tenés ${descTrim.length}).`;
    }
    if (condition < 1 || condition > 10)
      next.condition = "El estado debe estar entre 1 y 10.";

    const blockedTerm = findBlockedListingTerm(
      [titleTrim, descTrim, sellOtherText.trim()].filter(Boolean).join(" "),
    );
    if (blockedTerm) {
      next.title =
        "Esta publicación no cumple políticas: no permitimos comida, animales ni medicamentos.";
      next.description = `Detectamos un término restringido: "${blockedTerm}".`;
      if (sellCategory === SELL_CATEGORY_OTRO_ID) {
        next.sellOther =
          "El tipo de artículo no puede incluir comida, animales ni medicamentos.";
      }
    }
    const priceNum = Number(priceColones.replace(/\D/g, ""));
    if (!priceColones.trim() || !Number.isFinite(priceNum) || priceNum < 1) {
      next.price = "Ingresá un precio válido en colones.";
    }
    if (!weight) next.weight = "Seleccioná el peso aproximado.";
    if (!acceptedPayoutTerms) {
      next.payoutTerms =
        "Debés confirmar que entendés la condición de pago y la guía de envío.";
    }
    if (
      photoStepUnlocked &&
      sellCategory &&
      !isFichaCompleteForQuestions(questionsForSell, fichaTecnica)
    ) {
      next.ficha =
        "Completá todas las preguntas de verificación del vendedor para publicar.";
    }
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      setStatus("idle");
      return;
    }

    const slots = getPhotoSlotsForCategory(sellCategory);
    const assetsMeta = slots.map((s) => {
      const f = photos[s.id];
      return {
        slotId: s.id,
        kind: s.media,
        fileName: f?.name ?? "",
        fileSize: f?.size ?? 0,
      };
    });

    const draft: PublishDraftV1 = {
      version: 1,
      savedAt: new Date().toISOString(),
      sellCategory,
      sellCategoryLabel: buildSellCategoryLabel(
        sellCategory,
        sellOtherText,
        taxonomySafe,
      ),
      sellOtherText: sellOtherText.trim() || undefined,
      title: title.trim(),
      description: description.trim(),
      condition,
      priceColones: Number(priceColones.replace(/\D/g, "")),
      weightTier: weight,
      assetsMeta,
      ficha_tecnica: { ...fichaTecnica },
    };

    setLastDraft(draft);
    savePublishDraft(draft);
    setStatus("success");
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-obsidian-elevated px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-electric/60 focus:ring-1 focus:ring-violet-electric/40";

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 pb-4"
      noValidate
    >
      <PhotoTipsModal
        open={photoTipsOpen}
        onClose={() => setPhotoTipsOpen(false)}
      />

      <SellCategorySelector
        idPrefix={formId}
        value={sellCategory}
        onChange={(id) => {
          setSellCategory(id);
          if (id !== SELL_CATEGORY_OTRO_ID) setSellOtherText("");
          setErrors((e) => ({
            ...e,
            sellCategory: undefined,
            sellOther: undefined,
          }));
          setStatus("idle");
        }}
        otherValue={sellOtherText}
        onOtherChange={(t) => {
          setSellOtherText(t);
          setErrors((e) => ({ ...e, sellOther: undefined }));
          setStatus("idle");
        }}
        errorCategory={errors.sellCategory}
        errorOther={errors.sellOther}
        categoryOptions={taxonomySafe.categories}
      />

      <div>
        <h2 className="text-sm font-semibold text-white">
          Paso 2 · Archivos del artículo
        </h2>
        {!photoStepUnlocked ? (
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Elegí la categoría (y completá el tipo si es «Otro») para ver las guías
            de cada cuadro. Los textos se actualizan solos al cambiar de categoría.
          </p>
        ) : (
          <>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Subí los{" "}
              <span className="text-zinc-300">5 archivos obligatorios</span>.
              {photoSlots.some((s) => s.media === "video")
                ? " En esta categoría el último cuadro es un video corto."
                : " Todas las casillas son fotos."}
            </p>
            {errors.photos ? (
              <p className="mt-2 text-xs text-red-400" role="alert">
                {errors.photos}
              </p>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {photoSlots.map((slot, index) => {
                const inputId = `${formId}-${slot.id}`;
                const preview = previews[slot.id];
                const hasFile = Boolean(photos[slot.id]);
                const isVideo = slot.media === "video";
                const baseBox =
                  "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-dashed border-zinc-600/55 bg-obsidian ring-1 ring-white/[0.05] transition focus-within:border-violet-electric focus-within:ring-2 focus-within:ring-violet-electric/35 hover:border-violet-electric/70 hover:ring-violet-electric/20";
                const filledBox =
                  "border-solid border-violet-electric/35 bg-obsidian-elevated ring-violet-electric/15";
                const spanWide =
                  index === 4 ? "col-span-2 aspect-[16/9] sm:aspect-[21/9]" : "aspect-[4/5]";

                return (
                  <label
                    key={`${sellCategory}-${slot.id}`}
                    htmlFor={inputId}
                    className={`${baseBox} ${spanWide} ${hasFile ? filledBox : ""}`}
                  >
                    <input
                      id={inputId}
                      type="file"
                      accept={isVideo ? "video/*" : "image/*"}
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setPhotoForSlot(slot.id, f ?? null);
                        e.target.value = "";
                      }}
                    />
                    {preview ? (
                      isVideo ? (
                        <video
                          src={preview}
                          className="absolute inset-0 h-full w-full object-cover"
                          controls
                          playsInline
                          muted
                        />
                      ) : (
                        <Image
                          src={preview}
                          alt={`Vista previa ${slot.label}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 448px) 50vw, 100vw"
                          unoptimized
                        />
                      )
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1.5 p-3 text-center">
                        <span className="flex size-12 items-center justify-center rounded-full bg-obsidian-elevated text-zinc-500 ring-1 ring-white/[0.08]">
                          {isVideo ? (
                            <Video className="size-5" strokeWidth={1.75} />
                          ) : (
                            <Camera className="size-5" strokeWidth={1.75} />
                          )}
                        </span>
                        <span className="text-xs font-semibold tracking-wide text-zinc-100">
                          {slot.label}
                        </span>
                        <span className="px-1 text-[10px] leading-snug text-zinc-500">
                          {slot.hint}
                        </span>
                        {!isVideo ? (
                          <p className="mt-0.5 px-1 text-[10px] leading-snug text-zinc-600">
                            Tip: Usa una cobija de fondo liso para que la prenda resalte.
                          </p>
                        ) : (
                          <p className="mt-0.5 px-1 text-[10px] leading-snug text-zinc-600">
                            Tip: filmá con luz suave y poco movimiento.
                          </p>
                        )}
                      </div>
                    )}
                    {hasFile ? (
                      <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-neon-green">
                        {isVideo ? "Video listo" : "Listo"}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor={`${formId}-title`} className="text-xs font-medium text-zinc-400">
              Título
            </label>
            <span
              className={`text-[10px] tabular-nums ${
                title.trim().length >= 20 ? "text-zinc-600" : "text-zinc-500"
              }`}
            >
              {title.trim().length}/20 mín.
            </span>
          </div>
          <input
            id={`${formId}-title`}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((x) => ({ ...x, title: undefined }));
              setStatus("idle");
            }}
            className={`${inputClass} mt-1.5`}
            placeholder="Ej. Chaqueta denim vintage (mín. 20 caracteres)"
            minLength={20}
            maxLength={120}
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title ? (
            <p className="mt-1 text-xs text-red-400">{errors.title}</p>
          ) : null}
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label
              htmlFor={`${formId}-description`}
              className="text-xs font-medium text-zinc-400"
            >
              Descripción
            </label>
            <span
              className={`text-[10px] tabular-nums ${
                description.trim().length >= 300 ? "text-zinc-600" : "text-zinc-500"
              }`}
            >
              {description.trim().length}/300 mín.
            </span>
          </div>
          <textarea
            id={`${formId}-description`}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((x) => ({ ...x, description: undefined }));
              setStatus("idle");
            }}
            rows={6}
            minLength={300}
            className={`${inputClass} mt-1.5 resize-none`}
            placeholder="Medidas, composición, uso, imperfecciones, envío… (mínimo 300 caracteres)"
            aria-invalid={Boolean(errors.description)}
          />
          {errors.description ? (
            <p className="mt-1 text-xs text-red-400">{errors.description}</p>
          ) : null}
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label
              htmlFor={`${formId}-condition`}
              className="text-xs font-medium text-zinc-400"
            >
              Estado del artículo
            </label>
            <span className="text-sm font-semibold tabular-nums text-violet-electric">
              {condition}/10
            </span>
          </div>
          <input
            id={`${formId}-condition`}
            type="range"
            min={1}
            max={10}
            step={1}
            value={condition}
            onChange={(e) => {
              setCondition(Number(e.target.value));
              setErrors((x) => ({ ...x, condition: undefined }));
            }}
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-violet-electric"
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={condition}
            aria-invalid={Boolean(errors.condition)}
          />
          <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
            <span>Muy usado</span>
            <span>Como nuevo</span>
          </div>
          {errors.condition ? (
            <p className="mt-1 text-xs text-red-400">{errors.condition}</p>
          ) : null}
        </div>

        {photoStepUnlocked && sellCategory ? (
          <VendorVerificationBlock
            categoryId={sellCategory}
            value={fichaTecnica}
            onChange={(next) => {
              setFichaTecnica(next);
              setErrors((e) => ({ ...e, ficha: undefined }));
              setStatus("idle");
            }}
            error={errors.ficha}
            questionsOverride={questionsForSell}
          />
        ) : null}

        <div>
          <label htmlFor={`${formId}-price`} className="text-xs font-medium text-zinc-400">
            Precio (colones)
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              ₡
            </span>
            <input
              id={`${formId}-price`}
              type="text"
              inputMode="numeric"
              value={priceColones}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setPriceColones(raw);
                setErrors((x) => ({ ...x, price: undefined }));
                setStatus("idle");
              }}
              className={`${inputClass} pl-9 font-mono tabular-nums`}
              placeholder="25000"
              aria-invalid={Boolean(errors.price)}
            />
          </div>
          {errors.price ? (
            <p className="mt-1 text-xs text-red-400">{errors.price}</p>
          ) : null}
          <PublicationTransparencyCalculator
            formId={formId}
            priceColonesRaw={priceColones}
            weightTier={weight}
            accepted={acceptedPayoutTerms}
            onAcceptedChange={(v) => {
              setAcceptedPayoutTerms(v);
              setErrors((e) => ({ ...e, payoutTerms: undefined }));
              setStatus("idle");
            }}
            error={errors.payoutTerms}
          />
        </div>

        <div>
          <label
            htmlFor={`${formId}-weight`}
            className="text-xs font-medium text-zinc-400"
          >
            Peso aproximado (envío Correos de Costa Rica)
          </label>
          <select
            id={`${formId}-weight`}
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              setErrors((x) => ({ ...x, weight: undefined }));
              setStatus("idle");
            }}
            className={`${inputClass} mt-1.5 appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            }}
            aria-invalid={Boolean(errors.weight)}
          >
            {WEIGHT_OPTIONS.map((w) => (
              <option key={w.value || "w-empty"} value={w.value} disabled={w.value === ""}>
                {w.label}
              </option>
            ))}
          </select>
          {errors.weight ? (
            <p className="mt-1 text-xs text-red-400">{errors.weight}</p>
          ) : null}
          <div className="mt-3 space-y-2 rounded-xl border border-violet-electric/20 bg-violet-electric/[0.06] px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-zinc-300">
              <span className="font-semibold text-violet-200">Importante:</span>{" "}
              indicá el peso lo más fiel posible (embalaje incluido si ya lo tenés
              pensado). <span className="text-zinc-100">De este dato depende el
              costo del envío</span> que verá el comprador y que se sumará al
              total al pagar.
            </p>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              En De Mano en Mano calculamos una{" "}
              <span className="text-zinc-400">tarifa estimada de Correos de Costa
              Rica</span> según el rango elegido; en el checkout ese monto se
              muestra aparte y <span className="text-zinc-300">se suma al total</span>{" "}
              junto con la protección (demo con valores fijos por rango).
            </p>
          </div>
          {estimatedShippingColones != null ? (
            <p className="mt-2 text-xs text-zinc-400">
              Envío estimado con este rango:{" "}
              <span className="font-mono font-semibold text-zinc-100">
                ₡{formatColones(estimatedShippingColones)}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {status === "success" && lastDraft ? (
        <div
          className="rounded-xl border border-neon-green/25 bg-neon-green/10 px-3 py-3 text-center text-xs text-neon-green"
          role="status"
        >
          <p className="font-semibold">Publicación lista (demo)</p>
          <p className="mt-1.5 leading-relaxed text-[11px] text-zinc-400">
            Guardamos categoría, ficha técnica de verificación, peso y metadatos de
            tus archivos en este dispositivo (en producción iría a{" "}
            <span className="text-zinc-300">productos.ficha_tecnica</span> en
            Supabase). En el checkout se usa el mismo rango de peso para calcular el
            envío estimado y sumarlo al total.
          </p>
          <Link
            href={buildCheckoutHrefFromDraft(lastDraft)}
            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-violet-electric/50 bg-violet-electric/15 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-electric/25"
          >
            Ir al checkout con este artículo
          </Link>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!acceptedPayoutTerms}
        className="w-full rounded-2xl bg-violet-electric py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_-4px_rgba(138,43,226,0.55)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100"
      >
        Publicar producto
      </button>
    </form>
  );
}
