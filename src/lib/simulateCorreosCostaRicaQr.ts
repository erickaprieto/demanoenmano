import QRCode from "qrcode";

export type SimulateCorreosQrInput = {
  /** Identificador interno del pedido en la app. */
  orderId: string;
  /** Referencia tipo envío / guía (simulada). */
  carrierReference: string;
};

export type SimulateCorreosQrResult = {
  /** Imagen PNG en data URL lista para mostrar en `<img />`. */
  pngDataUrl: string;
  /** Texto breve para mostrar junto al QR. */
  label: string;
};

/**
 * Simula la generación del código QR que usarías con Correos de Costa Rica
 * después de un pago exitoso (retiro / etiqueta). Incluye una espera de red.
 */
export async function simulateCorreosCostaRicaQr(
  input: SimulateCorreosQrInput,
): Promise<SimulateCorreosQrResult> {
  await new Promise((r) => setTimeout(r, 650 + Math.floor(Math.random() * 450)));

  const payload = {
    servicio: "Correos de Costa Rica",
    tipo: "envio_simulado",
    referencia: input.carrierReference,
    pedidoApp: input.orderId,
    emitido: new Date().toISOString(),
  };

  const pngDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: "M",
    width: 256,
    margin: 1,
    color: {
      dark: "#FAFAFA",
      light: "#1A1A1A",
    },
  });

  return {
    pngDataUrl,
    label: `Referencia Correos (simulada): ${input.carrierReference}`,
  };
}
