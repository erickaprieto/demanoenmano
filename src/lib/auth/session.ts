import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "vibe_session";
const PASSWORD_KEYLEN = 64;

export type AuthSessionPayload = {
  userId: string;
  email: string;
  fullName: string;
  exp: number;
};

function requireSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET debe existir y tener al menos 32 caracteres.");
  }
  return secret;
}

function base64UrlEncode(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const withPad = normalized + (pad ? "=".repeat(4 - pad) : "");
  return Buffer.from(withPad, "base64");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, PASSWORD_KEYLEN).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expectedHex] = parts;
  const computed = scryptSync(password, salt, PASSWORD_KEYLEN);
  const expected = Buffer.from(expectedHex, "hex");
  if (computed.length !== expected.length) return false;
  return timingSafeEqual(computed, expected);
}

export function createSessionToken(payload: AuthSessionPayload): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", requireSessionSecret())
    .update(unsigned)
    .digest();
  return `${unsigned}.${base64UrlEncode(signature)}`;
}

export function verifySessionToken(token: string): AuthSessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expectedSig = createHmac("sha256", requireSessionSecret())
    .update(unsigned)
    .digest();
  const gotSig = base64UrlDecode(encodedSignature);
  if (expectedSig.length !== gotSig.length) return null;
  if (!timingSafeEqual(expectedSig, gotSig)) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
    if (
      typeof payload?.userId !== "string" ||
      typeof payload?.email !== "string" ||
      typeof payload?.fullName !== "string" ||
      typeof payload?.exp !== "number"
    ) {
      return null;
    }
    if (Date.now() / 1000 >= payload.exp) return null;
    return payload as AuthSessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookieName(): string {
  return SESSION_COOKIE;
}

export function readCookieFromHeader(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(";").map((v) => v.trim());
  for (const p of parts) {
    if (p.startsWith(`${name}=`)) {
      return decodeURIComponent(p.slice(name.length + 1));
    }
  }
  return null;
}

export function getSessionFromRequest(request: Request): AuthSessionPayload | null {
  const token = readCookieFromHeader(
    request.headers.get("cookie") ?? "",
    sessionCookieName(),
  );
  if (!token) return null;
  return verifySessionToken(token);
}
