/**
 * Días hábiles: Lunes a Viernes (excluye sábado y domingo, zona horaria local).
 */

function isWeekendLocal(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** Suma `count` días hábiles a partir del instante `start` (hora local preservada por día). */
export function addBusinessDaysLocal(start: Date, count: number): Date {
  const d = new Date(start.getTime());
  let added = 0;
  while (added < count) {
    d.setDate(d.getDate() + 1);
    if (!isWeekendLocal(d)) added += 1;
  }
  return d;
}

/**
 * Plazo de envío: 3 días hábiles desde la fecha del pedido (punto 3 de Términos).
 * Devuelve la fecha límite y si ya venció respecto a `now`.
 */
export function checkDeadline(
  orderDate: Date,
  now: Date = new Date(),
): { deadline: Date; isExpired: boolean } {
  const deadline = addBusinessDaysLocal(orderDate, 3);
  return { deadline, isExpired: now.getTime() > deadline.getTime() };
}

export function formatDeadlineEsCR(d: Date): string {
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
