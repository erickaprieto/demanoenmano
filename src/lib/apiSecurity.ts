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

export function requireTrustedOrigin(request: Request): Response | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;

  const origin = request.headers.get("origin")?.trim();
  const host = request.headers.get("host")?.trim();
  if (!origin) {
    return NextResponse.json({ error: "Origen inválido" }, { status: 403 });
  }

  const allowedOrigins = new Set<string>();
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    try {
      allowedOrigins.add(new URL(appUrl).origin);
    } catch {
      return NextResponse.json(
        { error: "APP_URL inválida en configuración." },
        { status: 500 },
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
