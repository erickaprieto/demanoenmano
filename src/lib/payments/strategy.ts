/**
 * Pagos en De Mano en Mano — qué implementar en producción (Costa Rica, CRC)
 *
 * 1) Elegir un proveedor (PSP) o banco que procese colones y reduzca alcance PCI:
 *    - Pasarela con checkout alojado (hosted) o SDK tokenizado (tarjeta nunca toca tu servidor).
 *    - SINPE Móvil / débito inmediato: suele ser convenio + API del banco o agregador local;
 *      el flujo “push” lo confirma el usuario en su app bancaria.
 *
 * 2) Backend: creá sesión/link de Cuanto con monto en ₡ y guardá `order_id` en PENDIENTE_PAGO.
 *
 * 3) Webhooks firmados del PSP: al `payment.succeeded` marcas la transacción PAGADO y disparás
 *    lógica de custodia (ya alineada con el modelo De Mano en Mano).
 *
 * Modo en cliente: `NEXT_PUBLIC_PAYMENTS_MODE=demo|live` (solo `live` intenta PSP vía API).
 *
 * Producción con Cuanto: usá `CUANTO_CHECKOUT_URL_TEMPLATE` o `CUANTO_CHECKOUT_URL`.
 */

export type PaymentsPublicMode = "demo" | "live";

export function getPaymentsPublicMode(): PaymentsPublicMode {
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_PAYMENTS_MODE === "live"
  ) {
    return "live";
  }
  return "demo";
}
