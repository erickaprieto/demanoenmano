export type CuantoSessionInput = {
  orderId: string;
  amountColones: number;
  description?: string;
  successUrl: string;
};

export type CuantoSessionOk = {
  ok: true;
  redirectUrl: string;
};

export type CuantoSessionFail = { ok: false; error: string };

export type CuantoSessionResult = CuantoSessionOk | CuantoSessionFail;

/**
 * Cuanto checkout session:
 * - `CUANTO_CHECKOUT_URL_TEMPLATE` supports placeholders:
 *   `{orderId}`, `{amountColones}`, `{description}`, `{successUrl}`.
 * - `CUANTO_CHECKOUT_URL` can be a static fallback URL.
 */
export async function createCuantoCheckoutSession(
  input: CuantoSessionInput,
): Promise<CuantoSessionResult> {
  const fromTemplate = buildFromTemplate(input);
  if (fromTemplate) return { ok: true, redirectUrl: fromTemplate };

  const staticUrl = process.env.CUANTO_CHECKOUT_URL?.trim();
  if (staticUrl) return { ok: true, redirectUrl: staticUrl };

  return {
    ok: false,
    error:
      "Cuanto no está configurado: definí CUANTO_CHECKOUT_URL_TEMPLATE (recomendado) o CUANTO_CHECKOUT_URL en el servidor.",
  };
}

function buildFromTemplate(input: CuantoSessionInput): string | null {
  const tpl = process.env.CUANTO_CHECKOUT_URL_TEMPLATE?.trim();
  if (!tpl) return null;

  const replacements: Record<string, string> = {
    orderId: input.orderId,
    amountColones: String(input.amountColones),
    description: input.description ?? "",
    successUrl: input.successUrl,
  };

  return tpl.replace(
    /\{(orderId|amountColones|description|successUrl)\}/g,
    (_m, key: keyof typeof replacements) =>
      encodeURIComponent(replacements[key]),
  );
}
