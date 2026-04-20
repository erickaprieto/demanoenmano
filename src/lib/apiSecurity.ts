import { NextResponse } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const memoryRateLimit = new Map<string, Bucket>();

function cleanupExpired(now: number): void {
  for (const [key, value] of memoryRateLimit.entries()) {
    if (value.resetAt <= now) memoryRateLimit.delete(key);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Interpreta `APP_URL` desde env (Vercel/.env a veces incluyen comillas o omiten el esquema).
 */
function isNonProduction(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** Solo desarrollo: host típico de `next dev` (cualquier puerto). */
function isLocalDevHost(host: string): boolean {
  if (!isNonProduction()) return false;
  try {
    const u = new URL(`http://${host}`);
    const h = u.hostname;
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "[::1]" ||
      h === "::1"
    );
  } catch {
    return false;
  }
}

/** Solo desarrollo: mismo máquina, cualquier puerto (Turbopack suele usar ≠ 3000). */
function isLocalDevOrigin(origin: string): boolean {
  if (!isNonProduction()) return false;
  try {
    const u = new URL(origin);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "[::1]" ||
      u.hostname === "::1"
    );
  } catch {
    return false;
  }
}

export function tryParseAppUrl(raw: string | undefined): URL | null {
  let s = String(raw ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    .trim();
  if (!s) return null;
  for (let i = 0; i < 3; i++) {
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      s = s.slice(1, -1).trim();
    } else {
      break;
    }
  }
  /* Solo la primera línea (a veces se pega .env + otra URL abajo). */
  s = s.split(/\r?\n/)[0]?.trim() ?? "";
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s.replace(/^\/+/, "")}`;
  }
  try {
    return new URL(s);
  } catch {
    return null;
  }
}

export function requireTrustedOrigin(request: Request): Response | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;

  const origin = request.headers.get("origin")?.trim();
  const host = request.headers.get("host")?.trim();
  if (!origin) {
    /* next dev / algunos clientes omiten Origin en same-origin; si Host es local, ok. */
    if (host && isLocalDevHost(host)) {
      return null;
    }
    return NextResponse.json({ error: "Origen inválido" }, { status: 403 });
  }

  const allowedOrigins = new Set<string>();
  const appUrlRaw = process.env.APP_URL?.trim();
  if (appUrlRaw) {
    const parsed = tryParseAppUrl(process.env.APP_URL);
    if (parsed) {
      allowedOrigins.add(parsed.origin);
    } else {
      /* No bloquear el sitio: Host + Origin del mismo request suelen alcanzar. */
      console.warn(
        "[apiSecurity] APP_URL definida pero ilegible; se omite. Corregí APP_URL en el servidor (ej. https://www.demanoenmano.lat).",
      );
    }
  }
  if (host) {
    allowedOrigins.add(`https://${host}`);
    allowedOrigins.add(`http://${host}`);
  }
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://localhost:3003");
  allowedOrigins.add("http://127.0.0.1:3000");
  allowedOrigins.add("http://127.0.0.1:3003");

  if (!allowedOrigins.has(origin)) {
    if (isLocalDevOrigin(origin)) {
      return null;
    }
    return NextResponse.json({ error: "Origen no autorizado" }, { status: 403 });
  }
  return null;
}

export function sanitizeText(input: unknown, maxLen: number): string {
  const value = String(input ?? "").trim();
  return value.length > maxLen ? value.slice(0, maxLen) : value;
}

export function isSafeId(id: string, min = 3, max = 80): boolean {
  return (
    id.length >= min &&
    id.length <= max &&
    /^[a-zA-Z0-9._:-]+$/.test(id)
  );
}

export function enforceRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  cleanupExpired(now);
  const current = memoryRateLimit.get(input.key);
  if (!current || current.resetAt <= now) {
    memoryRateLimit.set(input.key, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return { ok: true };
  }
  if (current.count >= input.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );
    return { ok: false, retryAfterSeconds };
  }
  current.count += 1;
  return { ok: true };
}

export function rateLimitExceededResponse(retryAfterSeconds: number): Response {
  return NextResponse.json(
    { error: "Demasiadas solicitudes, intentá de nuevo en unos segundos." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

export function requireModerationApiToken(request: Request): Response | null {
  const expectedToken = process.env.MODERATION_API_TOKEN?.trim();
  if (!expectedToken) {
    if (process.env.NODE_ENV !== "production") return null;
    return NextResponse.json(
      {
        error:
          "Moderation API deshabilitada por configuración (falta MODERATION_API_TOKEN).",
      },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization")?.trim() ?? "";
  const token =
    auth.startsWith("Bearer ") && auth.length > 7 ? auth.slice(7).trim() : "";

  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}
