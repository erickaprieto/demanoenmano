import type { ChatMessage } from "@/context/ChatContext";
import { analyzeChatMessage } from "@/lib/chatMessageGuard";

export type ChatReportSeverity = "standard" | "critical";

function isMessageFromViewer(m: ChatMessage, viewerTabId: string): boolean {
  if (m.seedAlign != null) return m.seedAlign === "right";
  return m.originTabId === viewerTabId;
}

/**
 * Últimos N mensajes del usuario reportado (interlocutor) en el hilo,
 * orden cronológico; se analizan los últimos 10 enviados por él/ella.
 */
export function scanReportedUserLastMessages(
  messages: readonly ChatMessage[],
  threadId: string,
  viewerTabId: string,
  maxMessages = 10,
): {
  severity: ChatReportSeverity;
  hitCount: number;
  categories: string[];
} {
  const fromPartner = messages
    .filter((m) => m.threadId === threadId)
    .filter((m) => !isMessageFromViewer(m, viewerTabId))
    .sort((a, b) => a.createdAt - b.createdAt);

  const lastFromPartner = fromPartner.slice(-maxMessages);
  const categories: string[] = [];
  let hitCount = 0;

  for (const m of lastFromPartner) {
    const r = analyzeChatMessage(m.body);
    if (!r.allowed) {
      hitCount += 1;
      categories.push(r.category);
    }
  }

  return {
    severity: hitCount > 0 ? "critical" : "standard",
    hitCount,
    categories,
  };
}
