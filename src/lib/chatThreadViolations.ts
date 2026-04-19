/**
 * Infracciones por conversación (demo: localStorage).
 * En producción: tabla `chat_infractions` en Supabase + política por conversación.
 */

const STORAGE_KEY = "vibe:chatThreadViolations:v1";
const MAX_INFRACTIONS = 3;
const LOCK_MS = 1000 * 60 * 60 * 24;

export type ThreadViolationState = {
  count: number;
  lockUntil: number;
};

type Store = Record<string, ThreadViolationState>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Store;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

function writeStore(s: Store): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("vibe-chat-violations-updated"));
}

export function getThreadViolationState(threadId: string): ThreadViolationState {
  const s = readStore()[threadId];
  return s ?? { count: 0, lockUntil: 0 };
}

export function isThreadChatLocked(threadId: string): boolean {
  return getThreadViolationState(threadId).lockUntil > Date.now();
}

/**
 * Registra un intento bloqueado (texto o imagen). Tras 3 infracciones activa bloqueo temporal.
 * Si el bloqueo ya venció, el contador se reinicia antes de sumar.
 */
export function recordChatInfraction(threadId: string): ThreadViolationState {
  const store = readStore();
  let prev = store[threadId] ?? { count: 0, lockUntil: 0 };
  const now = Date.now();

  if (prev.lockUntil > now) {
    return prev;
  }

  if (prev.lockUntil > 0 && prev.lockUntil <= now) {
    prev = { count: 0, lockUntil: 0 };
  }

  const count = prev.count + 1;
  let lockUntil = 0;
  if (count >= MAX_INFRACTIONS) {
    lockUntil = now + LOCK_MS;
  }

  const next: ThreadViolationState = { count, lockUntil };
  store[threadId] = next;
  writeStore(store);
  return next;
}
