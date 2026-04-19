import { NextResponse } from "next/server";
import {
  assignUserIdentityDocument,
  findUserIdByIdentityDocument,
  normalizeIdentityDocumentNumber,
} from "@/lib/auth/store";
import { verifySessionToken } from "@/lib/auth/session";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitExceededResponse,
  requireTrustedOrigin,
  sanitizeText,
} from "@/lib/apiSecurity";

export const runtime = "nodejs";

type Body = {
  setupToken?: string;
  idTipo?: string;
  idNumero?: string;
};

export async function POST(req: Request) {
  const badOrigin = requireTrustedOrigin(req);
  if (badOrigin) return badOrigin;

  const ip = getClientIp(req);
  const rate = enforceRateLimit({
    key: `auth-register-document:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rate.ok) return rateLimitExceededResponse(rate.retryAfterSeconds);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const setupToken = sanitizeText(body.setupToken, 12_000);
  const idTipo = sanitizeText(body.idTipo, 32).toLowerCase();
  const idNumeroRaw = sanitizeText(body.idNumero, 40);
  const idNumero = normalizeIdentityDocumentNumber(idNumeroRaw);

  if (!setupToken || !idTipo || !idNumero) {
    return NextResponse.json({ error: "Faltan datos de identificación o la sesión de registro." }, { status: 400 });
  }

  const session = verifySessionToken(setupToken);
  if (!session) {
    return NextResponse.json(
      { error: "Tu sesión de registro expiró. Volvé a completar el paso 1 (Registro)." },
      { status: 401 },
    );
  }

  const allowedTipo = ["nacional", "dimex", "pasaporte"];
  if (!allowedTipo.includes(idTipo)) {
    return NextResponse.json({ error: "Tipo de identificación no válido." }, { status: 400 });
  }

  const ownerId = await findUserIdByIdentityDocument(idTipo, idNumero);
  if (ownerId && ownerId !== session.userId) {
    return NextResponse.json(
      {
        error: "Ya existe un usuario asociado a este número de cédula",
        code: "CEDULA_EXISTS",
      },
      { status: 409 },
    );
  }

  try {
    await assignUserIdentityDocument({
      userId: session.userId,
      idTipo,
      idNumeroNormalized: idNumero,
    });
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code: unknown }).code)
        : "";
    if (code === "23505") {
      return NextResponse.json(
        {
          error: "Ya existe un usuario asociado a este número de cédula",
          code: "CEDULA_EXISTS",
        },
        { status: 409 },
      );
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
