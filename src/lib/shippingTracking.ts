export type TrackingStepKey =
  | "guia_generada"
  | "recogido_correos"
  | "en_transito"
  | "entregado";

export type TrackingStep = {
  key: TrackingStepKey;
  label: string;
  completed: boolean;
  current: boolean;
  at: string | null;
  detail?: string | null;
};

export type DemoOrderStatus =
  | "pendiente_envio"
  | "en_camino"
  | "entregado"
  | "reembolso_automatico";

export function buildTrackingTimeline(input: {
  orderStatus: DemoOrderStatus;
  trackingNumber: string | null;
}): TrackingStep[] {
  const hasGuide = Boolean(input.trackingNumber?.trim());
  const isInTransit = input.orderStatus === "en_camino" || input.orderStatus === "entregado";
  const isDelivered = input.orderStatus === "entregado";
  const now = new Date().toISOString();

  const steps: TrackingStep[] = [
    {
      key: "guia_generada",
      label: "Guía Generada",
      completed: hasGuide,
      current: hasGuide && !isInTransit,
      at: hasGuide ? now : null,
      detail: hasGuide ? input.trackingNumber : "Pendiente por vendedor",
    },
    {
      key: "recogido_correos",
      label: "Recogido por Correos CR",
      completed: isInTransit,
      current: isInTransit && !isDelivered,
      at: isInTransit ? now : null,
      detail: isInTransit ? "Paquete recibido en sucursal o ruta de recogida" : null,
    },
    {
      key: "en_transito",
      label: "En Tránsito",
      completed: isInTransit,
      current: isInTransit && !isDelivered,
      at: isInTransit ? now : null,
      detail: isInTransit ? "Traslado entre centros logísticos" : null,
    },
    {
      key: "entregado",
      label: "Entregado",
      completed: isDelivered,
      current: isDelivered,
      at: isDelivered ? now : null,
      detail: isDelivered ? "Entrega confirmada al destinatario" : "Pendiente",
    },
  ];
  return steps;
}
