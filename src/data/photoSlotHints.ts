import { SELL_CATEGORY_OTRO_ID } from "@/data/sellCategories";

export const PHOTO_SLOT_IDS = [
  "slot1",
  "slot2",
  "slot3",
  "slot4",
  "slot5",
] as const;

export type PhotoSlotId = (typeof PHOTO_SLOT_IDS)[number];

export type PhotoMediaKind = "image" | "video";

export type PhotoSlotDef = {
  id: PhotoSlotId;
  label: string;
  hint: string;
  media: PhotoMediaKind;
};

const img = (
  id: PhotoSlotId,
  label: string,
  hint: string,
): PhotoSlotDef => ({ id, label, hint, media: "image" });

const vid = (
  id: PhotoSlotId,
  label: string,
  hint: string,
): PhotoSlotDef => ({ id, label, hint, media: "video" });

/** Guías genéricas (Otro, categoría vacía o no mapeada). */
export const DEFAULT_PHOTO_SLOTS: PhotoSlotDef[] = [
  img("slot1", "Vista frontal", "Mostrá el artículo de frente, bien iluminado."),
  img("slot2", "Vista trasera o lateral", "Contrapeso o detalles que no se ven al frente."),
  img("slot3", "Marca, modelo o etiqueta", "Cercanía legible de sellos y datos."),
  img("slot4", "Textura o componentes", "Materiales, conectores o piezas clave."),
  img("slot5", "Estado general", "Desgaste, rayones o conjunto completo."),
];

const HINTS_BY_CATEGORY: Record<string, PhotoSlotDef[]> = {
  electronica: [
    img("slot1", "Pantalla encendida", "Demostrá que enciende y se ve el panel."),
    img("slot2", "Carcaza frontal / teclado", "Teclas, bisagras o botones visibles."),
    img("slot3", "Número de serie", "Etiqueta OEM o grabado en chasis."),
    img("slot4", "Puertos y accesorios", "Cargador, cables o ranuras incluidas."),
    img("slot5", "Estado físico", "Golpes, rayones o deformaciones."),
  ],
  calzado: [
    img("slot1", "Vista superior", "Empeine y cordones o cierres."),
    img("slot2", "Lateral exterior", "Costuras y logo de marca."),
    img("slot3", "Suela del zapato", "Desgaste de tacos y tracción."),
    img("slot4", "Talón y puntera", "Forma y posibles rozaduras."),
    img("slot5", "Par o caja", "Ambas piezas o empaque si aplica."),
  ],
  herramientas: [
    img("slot1", "Identificación frontal", "Marca, modelo y estado general."),
    img("slot2", "Placa de datos o gatillo", "Potencia, RPM o calibración."),
    img("slot3", "Mandíbulas, disco o filo", "Parte de trabajo sin peligro."),
    img("slot4", "Accesorios incluidos", "Baterías, maletín o brocas."),
    vid(
      "slot5",
      "Video en uso",
      "Corta demostración encendida (obligatorio en esta categoría).",
    ),
  ],
  consolas: [
    img("slot1", "Consola encendida", "Menú principal visible."),
    img("slot2", "Serie y etiquetas", "Legible y sin borrar."),
    img("slot3", "Controles", "Cantidad y sticks / gatillos."),
    img("slot4", "Puertos y ranuras", "HDMI, USB o lector."),
    img("slot5", "Juegos o embalaje", "Lo que se entrega con la unidad."),
  ],
  moda: [
    img("slot1", "Frontal", "Prenda extendida, bien planchada."),
    img("slot2", "Trasera", "Costuras y cierres."),
    img("slot3", "Etiqueta", "Marca, talla y composición."),
    img("slot4", "Detalle tela", "Textura y color fiel."),
    img("slot5", "Estado general", "Desgaste global y conjunto."),
  ],
  ropa_mascotas: [
    img(
      "slot1",
      "Vista frontal",
      "Prenda o accesorio sobre superficie neutra; indicá si es para perro, gato u otro.",
    ),
    img("slot2", "Vista trasera o cierres", "Hebillas, velcro, elasticidad o broches."),
    img("slot3", "Etiqueta de talla", "Marca, medida (S/M/L) o peso del animal si aplica."),
    img("slot4", "Textura y elasticidad", "Tejido, malla, cuero sintético, etc."),
    img("slot5", "Estado y uso", "Pelos atrapados, desgaste o accesorios incluidos."),
  ],
  deportes: [
    img("slot1", "Artículo desplegado", "Forma completa del producto."),
    img("slot2", "Marcas y tallas", "Etiquetas internas o externas."),
    img("slot3", "Ajustes", "Cordones, velcros o broches."),
    img("slot4", "Interior o plantilla", "Si aplica al calzado."),
    img("slot5", "Desgaste", "Zonas de mayor uso."),
  ],
  belleza: [
    img("slot1", "Empaque frontal", "Nombre del producto legible."),
    img("slot2", "Contenido sellado", "Sin abrir si es nuevo."),
    img("slot3", "Lote o vencimiento", "Fecha y registro."),
    img("slot4", "Textura o tono", "Color real al natural."),
    img("slot5", "Estado del envase", "Abolladuras o fugas."),
  ],
  bebes_ninos: [
    img("slot1", "Artículo completo", "Vista general armado o desplegado."),
    img("slot2", "Etiquetas de seguridad", "Normas y advertencias."),
    img("slot3", "Texturas", "Tejidos suaves o plásticos."),
    img("slot4", "Cierres y hebillas", "Broches, cremalleras o imanes."),
    img("slot5", "Estado de uso", "Manchas o desgaste."),
  ],
  juguetes: [
    img("slot1", "Frente del juguete", "Personaje o vehículo principal."),
    img("slot2", "Funciones", "Luces, sonidos o ruedas."),
    img("slot3", "Piezas móviles", "Articulaciones o accesorios."),
    img("slot4", "Edad en etiqueta", "Recomendación del fabricante."),
    img("slot5", "Embalaje", "Caja original o piezas sueltas."),
  ],
  hobbies: [
    img("slot1", "Pieza principal", "Figura, modelo o colección."),
    img("slot2", "Detalle pintura", "Escala o acabado."),
    img("slot3", "Accesorios", "Armas, bases o dados incluidos."),
    img("slot4", "Caja o certificado", "Autenticidad si existe."),
    img("slot5", "Daños", "Faltantes o reparaciones."),
  ],
  hogar: [
    img("slot1", "Vista en contexto", "Sobre mesa o ambiente neutro."),
    img("slot2", "Medidas referencia", "Regla o mano para escala."),
    img("slot3", "Material", "Cerámica, madera o metal."),
    img("slot4", "Componentes", "Tornillos, patas o tapas."),
    img("slot5", "Defectos", "Marcas o fisuras."),
  ],
  mascotas: [
    img(
      "slot1",
      "Accesorio completo",
      "Correa, arnés, cama, transportadora u otro artículo (no alimentos).",
    ),
    img("slot2", "Marca y referencia", "Etiqueta o grabado del fabricante."),
    img("slot3", "Cierres y ajustes", "Hebillas, broches o mecanismos."),
    img("slot4", "Textura o material", "Tejido, plástico, metal, etc."),
    img("slot5", "Estado general", "Desgaste, costuras o piezas incluidas."),
  ],
};

/**
 * Cinco cuadros de carga según categoría de venta.
 * “Otro” y categorías desconocidas usan {@link DEFAULT_PHOTO_SLOTS}.
 */
export function getPhotoSlotsForCategory(categoryId: string): PhotoSlotDef[] {
  if (!categoryId || categoryId === SELL_CATEGORY_OTRO_ID) {
    return DEFAULT_PHOTO_SLOTS;
  }
  return HINTS_BY_CATEGORY[categoryId] ?? DEFAULT_PHOTO_SLOTS;
}

export function emptyPhotoState(): Record<PhotoSlotId, File | null> {
  return {
    slot1: null,
    slot2: null,
    slot3: null,
    slot4: null,
    slot5: null,
  };
}

export function emptyPreviewState(): Record<PhotoSlotId, string | null> {
  return {
    slot1: null,
    slot2: null,
    slot3: null,
    slot4: null,
    slot5: null,
  };
}
