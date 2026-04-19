/**
 * URL mailto para “Contactar soporte” (cliente: usar NEXT_PUBLIC_SUPPORT_EMAIL).
 */
export function buildSupportMailto(input: { subject: string; body: string }): string {
  const email =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()) ||
    "soporte@demanoenmano.cr";
  const subject = encodeURIComponent(input.subject);
  const body = encodeURIComponent(input.body);
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
