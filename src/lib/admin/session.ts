import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_COOKIE = "vibe_admin_session";

type AdminPayload = {
  email: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET es requerida para sesiones admin.");
  }
  return secret;
}

function b64UrlEncode(value: string | Buffer): string {
  const b = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  return Buffer.from(normalized + (pad ? "=".repeat(4 - pad) : ""), "base64");
}

export function adminCookieName(): string {
  return ADMIN_COOKIE;
}

export function createAdminToken(email: string): string {
  const payload: AdminPayload = {
    email: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  };
  const head = b64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64UrlEncode(JSON.stringify(payload));
  const unsigned = `${head}.${body}`;
  const sig = createHmac("sha256", getSecret()).update(unsigned).digest();
  return `${unsigned}.${b64UrlEncode(sig)}`;
}

export function verifyAdminToken(token: string): AdminPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [head, body, sig] = parts;
  const unsigned = `${head}.${body}`;
  const expected = createHmac("sha256", getSecret()).update(unsigned).digest();
  const got = b64UrlDecode(sig);
  if (expected.length !== got.length) return null;
  if (!timingSafeEqual(expected, got)) return null;
  try {
    const parsed = JSON.parse(b64UrlDecode(body).toString("utf8")) as AdminPayload;
    if (!parsed?.email || !parsed?.exp) return null;
    if (Date.now() / 1000 >= parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readCookie(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(";").map((v) => v.trim());
  for (const p of parts) {
    if (p.startsWith(`${name}=`)) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

export function requireAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!expectedEmail || !expectedPassword) return false;
  return email.toLowerCase() === expectedEmail && password === expectedPassword;
}
