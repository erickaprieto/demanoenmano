/** Caracteres especiales permitidos para contraseñas de usuario. */
export const USER_PASSWORD_SPECIAL_CHARS = "!#$%&" as const;

export const USER_PASSWORD_REQUIREMENTS_SHORT =
  "Mínimo 10 caracteres, 1 mayúscula, 1 minúscula, 3 números y 1 especial (! # $ % &).";

/**
 * Reglas para cualquier cuenta de usuario (registro, recuperación, reset por admin).
 */
export function validateUserPassword(password: string): { ok: true } | { ok: false; error: string } {
  if (password.length < 10) {
    return { ok: false, error: "La contraseña debe tener al menos 10 caracteres." };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, error: "La contraseña debe incluir al menos una letra minúscula." };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, error: "La contraseña debe incluir al menos una letra mayúscula." };
  }
  const digits = (password.match(/\d/g) ?? []).length;
  if (digits < 3) {
    return { ok: false, error: "La contraseña debe incluir al menos 3 números." };
  }
  if (!/[!#$%&]/.test(password)) {
    return {
      ok: false,
      error: "La contraseña debe incluir al menos un carácter especial: ! # $ % &",
    };
  }
  return { ok: true };
}

export function isUserPasswordValid(password: string): boolean {
  return validateUserPassword(password).ok;
}
