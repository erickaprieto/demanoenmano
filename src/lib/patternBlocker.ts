/**
 * @deprecated Usá `analyzeChatMessage` desde `@/lib/chatMessageGuard`.
 * Se mantiene para imports legacy y mensajes genéricos.
 */

import {
  analyzeChatMessage,
  CHAT_MODAL_COPY,
} from "@/lib/chatMessageGuard";

export const CHAT_SECURITY_NOTICE = CHAT_MODAL_COPY.contact_payment.body;

export type PatternBlockResult =
  | { allowed: true }
  | { allowed: false; reason: "pattern_blocker" };

export function patternBlocker(text: string): PatternBlockResult {
  const r = analyzeChatMessage(text);
  if (r.allowed) return { allowed: true };
  return { allowed: false, reason: "pattern_blocker" };
}
