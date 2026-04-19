/**
 * Cuestionario de verificación por categoría (respuestas → JSONB `ficha_tecnica` en Supabase).
 * Valores guardados: "yes" | "no" para yesno; string del tag para `tags`.
 */

export type VendorQuestionKind = "yesno" | "tags";

export type VendorQuestion = {
  id: string;
  label: string;
  kind: VendorQuestionKind;
  /** Opciones para `kind: "tags"`. */
  options?: readonly string[];
  /**
   * Para yesno: respuesta favorable al comprador (icono verde neón en detalle).
   * Si no se define, cualquier respuesta cuenta como “declarada” (icono neutro).
   */
  goodAnswer?: "yes" | "no";
};

/** Grupos de categorías (ids en `sellCategories.ts`). */
export const VENDOR_VERIFICATION_GROUPS = {
  moda_bebes: ["moda", "bebes_ninos", "ropa_mascotas"],
  calzado: ["calzado"],
  electronica_consolas: ["electronica", "consolas"],
  herramientas: ["herramientas"],
  hogar: ["hogar"],
  deportes: ["deportes"],
  belleza: ["belleza"],
  hobbies_juguetes_mascotas: ["hobbies", "juguetes"],
  otro: ["otro"],
} as const;

export type VendorVerificationGroupKey = keyof typeof VENDOR_VERIFICATION_GROUPS;

const CATEGORY_TO_GROUP = (() => {
  const map: Record<string, VendorVerificationGroupKey> = {};
  (Object.keys(VENDOR_VERIFICATION_GROUPS) as VendorVerificationGroupKey[]).forEach(
    (gk) => {
      for (const id of VENDOR_VERIFICATION_GROUPS[gk]) {
        map[id] = gk;
      }
    },
  );
  return map;
})();

export const VENDOR_QUESTIONS: Record<VendorVerificationGroupKey, VendorQuestion[]> =
  {
    moda_bebes: [
      {
        id: "manchas_motas",
        label: "¿Tiene manchas o motas/chanchitos?",
        kind: "yesno",
        goodAnswer: "no",
      },
      {
        id: "ajustes_sastre",
        label: "¿Ha tenido ajustes de sastre?",
        kind: "yesno",
        goodAnswer: "no",
      },
      {
        id: "libre_olor_tabaco",
        label: "¿Libre de olor a tabaco?",
        kind: "yesno",
        goodAnswer: "yes",
      },
    ],
    calzado: [
      {
        id: "suela_despegada_reparada",
        label: "¿Suela despegada o reparada?",
        kind: "yesno",
        goodAnswer: "no",
      },
      {
        id: "uso_calcetines",
        label: "¿Uso con calcetines?",
        kind: "yesno",
        goodAnswer: "yes",
      },
      {
        id: "cuero_real",
        label: "¿Material cuero real?",
        kind: "yesno",
        goodAnswer: "yes",
      },
      {
        id: "caja_original",
        label: "¿Incluye caja original?",
        kind: "yesno",
        goodAnswer: "yes",
      },
    ],
    electronica_consolas: [
      {
        id: "rayones",
        label: "¿Rayones?",
        kind: "yesno",
        goodAnswer: "no",
      },
      {
        id: "contacto_humedad",
        label: "¿Contacto con humedad?",
        kind: "yesno",
        goodAnswer: "no",
      },
      {
        id: "factura_original",
        label: "¿Factura original?",
        kind: "yesno",
        goodAnswer: "yes",
      },
    ],
    herramientas: [
      {
        id: "uso_industrial_domestico",
        label: "¿Uso industrial o doméstico?",
        kind: "tags",
        options: ["Industrial", "Doméstico"] as const,
      },
      {
        id: "incluye_estuche",
        label: "¿Incluye estuche?",
        kind: "yesno",
        goodAnswer: "yes",
      },
      {
        id: "tiene_oxido",
        label: "¿Tiene óxido?",
        kind: "yesno",
        goodAnswer: "no",
      },
      {
        id: "cable_sin_reparaciones",
        label: "¿Cable de poder sin reparaciones?",
        kind: "yesno",
        goodAnswer: "yes",
      },
    ],
    hogar: [
      {
        id: "golpes_no_visibles",
        label: "¿Golpes no visibles en fotos?",
        kind: "yesno",
        goodAnswer: "no",
      },
      {
        id: "viene_armado",
        label: "¿Viene armado?",
        kind: "yesno",
      },
      {
        id: "material",
        label: "Material",
        kind: "tags",
        options: ["Madera", "MDF", "Metal"] as const,
      },
      {
        id: "exposicion_sol",
        label: "¿Exposición directa al sol?",
        kind: "yesno",
        goodAnswer: "no",
      },
    ],
    deportes: [
      {
        id: "elasticos_fuerza",
        label: "¿Elásticos con fuerza original?",
        kind: "yesno",
        goodAnswer: "yes",
      },
      {
        id: "corrosion_sudor",
        label: "¿Corrosión por sudor?",
        kind: "yesno",
        goodAnswer: "no",
      },
      {
        id: "ruidos_uso",
        label: "¿Ruidos al usarse?",
        kind: "yesno",
        goodAnswer: "no",
      },
      {
        id: "incluye_manual",
        label: "¿Incluye manual?",
        kind: "yesno",
        goodAnswer: "yes",
      },
    ],
    belleza: [
      {
        id: "sello_seguridad",
        label: "¿Sello de seguridad intacto?",
        kind: "yesno",
        goodAnswer: "yes",
      },
      {
        id: "vencimiento_visible",
        label: "¿Fecha de vencimiento visible?",
        kind: "yesno",
        goodAnswer: "yes",
      },
      {
        id: "guardado_lugar_fresco",
        label: "¿Guardado en lugar fresco?",
        kind: "yesno",
        goodAnswer: "yes",
      },
    ],
    hobbies_juguetes_mascotas: [
      {
        id: "edicion_limitada",
        label: "¿Edición limitada?",
        kind: "yesno",
        goodAnswer: "yes",
      },
      {
        id: "articulaciones_ok",
        label: "¿Estado de articulaciones correcto?",
        kind: "yesno",
        goodAnswer: "yes",
      },
      {
        id: "facil_desinfectar",
        label: "¿Fácil de desinfectar?",
        kind: "yesno",
        goodAnswer: "yes",
      },
      {
        id: "lleva_baterias",
        label: "¿Lleva baterías o pilas?",
        kind: "yesno",
      },
    ],
    otro: [
      {
        id: "descripcion_uso_especifica",
        label: "¿Incluiste descripción de uso específica?",
        kind: "yesno",
        goodAnswer: "yes",
      },
      {
        id: "detalles_ocultos_declarados",
        label: "¿Declaraste detalles no visibles en fotos?",
        kind: "yesno",
        goodAnswer: "yes",
      },
    ],
  };

export type FichaTecnicaV1 = Record<string, string>;

export function getVerificationGroupForCategory(
  categoryId: string,
): VendorVerificationGroupKey {
  return CATEGORY_TO_GROUP[categoryId] ?? "otro";
}

export function getQuestionsForCategory(categoryId: string): VendorQuestion[] {
  const g = getVerificationGroupForCategory(categoryId);
  return VENDOR_QUESTIONS[g] ?? VENDOR_QUESTIONS.otro;
}

export function isFichaCompleteForQuestions(
  questions: VendorQuestion[],
  ficha: FichaTecnicaV1,
): boolean {
  if (questions.length === 0) return false;
  return questions.every((q) => {
    const v = ficha[q.id];
    if (q.kind === "yesno") {
      return v === "yes" || v === "no";
    }
    if (q.kind === "tags") {
      return Boolean(v && q.options?.includes(v));
    }
    return false;
  });
}

export function isFichaComplete(
  categoryId: string,
  ficha: FichaTecnicaV1,
): boolean {
  if (!categoryId) return false;
  return isFichaCompleteForQuestions(getQuestionsForCategory(categoryId), ficha);
}

/** Para UI de detalle: respuesta Sí/No favorable al comprador (verde neón). */
export function isPositiveAnswer(q: VendorQuestion, value: string): boolean {
  if (q.kind !== "yesno") return false;
  if (value !== "yes" && value !== "no") return false;
  if (q.goodAnswer == null) return false;
  return value === q.goodAnswer;
}
