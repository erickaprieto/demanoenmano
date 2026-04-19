/**
 * Motor ultra-estricto de filtrado de chat (marketplace: comisiones, seguridad, pagos en app).
 */

export type ChatBlockCategory =
  | "contact_payment"
  | "barter"
  | "negotiation";

export type ChatMessageGuardResult =
  | { allowed: true }
  | { allowed: false; category: ChatBlockCategory };

/** Evento de UI (modal educativo o bloqueo temporal). */
export type ChatGuardEvent =
  | { type: "blocked_text"; category: ChatBlockCategory }
  | { type: "blocked_image" }
  | { type: "thread_locked"; until: number };

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

function norm(s: string): string {
  return stripDiacritics(s).toLowerCase();
}

/** Email visible o patrón @ + dominio. */
const EMAIL_RE =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function hasEmail(text: string): boolean {
  if (EMAIL_RE.test(text)) return true;
  const lower = text.toLowerCase();
  return lower.includes("@") && /[a-z0-9.-]+\.[a-z]{2,}/i.test(lower);
}

/** Teléfonos CR: 506 + 8 dígitos, 4-4 con separadores, 8 dígitos seguidos u 8 dígitos separados uno a uno. */
function hasPhoneLike(text: string): boolean {
  const t = text.replace(/\u00a0/g, " ");
  if (/(?<![\d])\+?506[\s.\-\/]*\d{4}[\s.\-\/]?\d{4}(?![\d])/i.test(t))
    return true;
  if (/(?<![\d])\d{4}[\s.\-\/]+\d{4}(?![\d])/.test(t)) return true;
  if (/(?<![\d])\d{8}(?![\d])/.test(t)) return true;
  if (/(?<![\d])(?:\d[\s.\-_]){7}\d(?![\d])/.test(t)) return true;
  return false;
}

/** Intento explícito de compartir canal de contacto (además de patrones estructurales). */
function hasContactShareIntent(text: string): boolean {
  const n = norm(text);
  const patterns = [
    /\bmi\s+(numero|número|celular|telefono|teléfono|whatsapp|correo)\b/,
    /\bte\s+paso\s+(el\s+|mi\s+)?(numero|número|whatsapp|cel|mail)\b/,
    /\bcontacta(me|te)\s+(al\s+|por\s+)/,
    /\bescrib(i|í)(me|te)\s+(al\s+|por\s+)/,
    /\bllam(a|á)(me|te)\s+(al\s+)?/,
    /\bmi\s+sinpe\b/,
    /\bte\s+mando\s+(el\s+)?(sinpe|qr|codigo|código)\b/,
  ];
  return patterns.some((re) => re.test(n));
}

function hasSocialHandles(text: string): boolean {
  const n = norm(text);
  const patterns = [
    /\binstagram\b/,
    /\binstagra\b/,
    /\big\b/,
    /\bfacebook\b/,
    /\bfb\b/,
    /\bwhatsapp\b/,
    /\bwhats\s*app\b/,
    /\bwsp\b/,
    /\bwsapp\b/,
    /\btelegram\b/,
    /\btg\s*:\s*@/,
    /\binst\s*:\s*@/,
  ];
  return patterns.some((re) => re.test(n));
}

function hasBarter(text: string): boolean {
  const n = norm(text);
  const phrases = [
    "cambalache",
    "trueque",
    "acepta cambios",
    "aceptas cambios",
    "acepta cambio",
    "hacemos cambio",
    "hacemos trueque",
  ];
  if (phrases.some((p) => n.includes(p))) return true;
  if (/\bcambio\b/.test(n) && !/\bsin\s+cambio\b/.test(n)) return true;
  if (/le\s+doy\s+un\b/.test(n)) return true;
  if (/le\s+interesa\s+un\b/.test(n)) return true;
  return false;
}

function hasNegotiation(text: string): boolean {
  const n = norm(text);
  const phrases = [
    "descuento",
    "rebaja",
    "oferta",
    "negociable",
    "barato",
    "precio minimo",
    "precio mínimo",
    "mas barato",
    "más barato",
    "me lo dejas en",
    "ultimo precio",
    "último precio",
  ];
  if (phrases.some((p) => n.includes(p))) return true;
  if (/cuanto\s+lo\s+menos\b/.test(n)) return true;
  if (/cuánto\s+lo\s+menos\b/.test(n)) return true;
  return false;
}

function hasExternalPayment(text: string): boolean {
  const n = norm(text);
  const phrases = [
    "sinpe",
    "s i n p e",
    "sin-pe",
    "sin_pe",
    "s1npe",
    "efectivo",
    "transferencia",
    "transferencia bancaria",
    "deposito",
    "depósito",
    "por fuera",
    "pago por fuera",
    "cash",
    "pago directo",
    "pago en efectivo",
    "sin pasar por",
    "zelle",
    "paypal",
    "venmo",
  ];
  return phrases.some((p) => n.includes(p));
}

/** URLs y acortadores típicos (evitar tráfico fuera de De Mano en Mano). */
function hasExternalLink(text: string): boolean {
  const t = text.trim();
  if (/https?:\/\/[^\s<>"']+/i.test(t)) return true;
  if (/\bwww\.[^\s<>"']+\.[a-z]{2,}\b/i.test(t)) return true;
  if (/\bbit\.ly\/[\w-]+\b/i.test(t)) return true;
  if (/\btinyurl\.com\/[\w-]+\b/i.test(t)) return true;
  return false;
}

function hasMeetup(text: string): boolean {
  const n = norm(text);
  const loose = [
    "punto medio",
    "nos vemos en",
    "entrega personal",
    "entrega en mano",
    "te lo llevo",
    "paso a buscar",
    "city mall",
    "plaza mayor",
    "en el centro comercial",
  ];
  if (loose.some((p) => n.includes(p))) return true;
  if (/\bmall\b/.test(n)) return true;
  if (/\bmultiplaza\b/.test(n)) return true;
  if (/\bparque\b/.test(n)) return true;
  return false;
}

function hasContactOrPaymentOrMeet(text: string): boolean {
  return (
    hasEmail(text) ||
    hasPhoneLike(text) ||
    hasContactShareIntent(text) ||
    hasSocialHandles(text) ||
    hasExternalPayment(text) ||
    hasMeetup(text)
  );
}

/**
 * Analiza el texto del chat. Prioridad de categoría para avisos educativos.
 */
export function analyzeChatMessage(text: string): ChatMessageGuardResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { allowed: true };

  if (hasExternalLink(trimmed)) {
    return { allowed: false, category: "contact_payment" };
  }

  if (hasContactOrPaymentOrMeet(trimmed)) {
    return { allowed: false, category: "contact_payment" };
  }
  if (hasBarter(trimmed)) {
    return { allowed: false, category: "barter" };
  }
  if (hasNegotiation(trimmed)) {
    return { allowed: false, category: "negotiation" };
  }

  return { allowed: true };
}

/** Escaneo en vivo del borrador (misma lógica que el envío). */
export function scanChatDraft(text: string): ChatMessageGuardResult {
  return analyzeChatMessage(text);
}

export const CHAT_MODAL_COPY: Record<
  ChatBlockCategory,
  { title: string; body: string }
> = {
  barter: {
    title: "Intercambios no permitidos",
    body: "¡De Mano en Mano es un marketplace de venta! No se permiten intercambios para asegurar que recibas el dinero en tu saldo en la app.",
  },
  contact_payment: {
    title: "Mantené todo en De Mano en Mano",
    body: "Por tu seguridad, mantén el contacto y el pago dentro de la app. Así proteges tu dinero con la garantía De Mano en Mano y Correos de CR.",
  },
  negotiation: {
    title: "Precios fijos",
    body: "Los precios en De Mano en Mano son fijos. Esto garantiza una experiencia rápida y profesional para todos.",
  },
};
