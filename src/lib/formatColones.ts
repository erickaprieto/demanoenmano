/**
 * Formatea montos en colones (sin decimales).
 * Implementación fija (miles con punto) para que SSR y cliente coincidan:
 * `Intl.NumberFormat("es-CR")` puede usar espacio vs punto según runtime (Node vs browser).
 */
export function formatColones(amount: number): string {
  const n = Math.round(Number(amount));
  if (!Number.isFinite(n)) return "0";
  const negative = n < 0;
  const digits = String(Math.abs(Math.trunc(n)));
  const groups: string[] = [];
  let i = digits.length;
  while (i > 0) {
    const start = Math.max(0, i - 3);
    groups.unshift(digits.slice(start, i));
    i = start;
  }
  return (negative ? "-" : "") + groups.join(".");
}

/** Precio en UI: símbolo ₡ + monto (miles con punto, estilo común en CRC). */
export function formatPrecioCRC(amount: number): string {
  return `₡${formatColones(amount)}`;
}
