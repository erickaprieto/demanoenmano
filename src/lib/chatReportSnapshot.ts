import type { ChatMessage } from "@/context/ChatContext";

export type ChatSnapshotLine = {
  from: "reportante" | "reportado";
  body: string;
  at: number;
};

const SNIPPET_MAX = 1_400;
const SNAPSHOT_MAX_MESSAGES = 45;
const SNAPSHOT_JSON_MAX = 48_000;

function messageFromReporter(
  m: ChatMessage,
  threadId: string,
  viewerTabId: string,
): boolean {
  if (m.threadId !== threadId) return false;
  if (m.seedAlign != null) return m.seedAlign === "right";
  return m.originTabId === viewerTabId;
}

/**
 * Fragmento para moderación: perspectiva del reportante vs reportado (sin IDs de pestaña).
 */
export function buildChatReportSnapshot(input: {
  messages: readonly ChatMessage[];
  threadId: string;
  viewerTabId: string;
}): { chatSnippet: string; chatSnapshotJson: string } {
  const sorted = input.messages
    .filter((m) => m.threadId === input.threadId)
    .sort((a, b) => a.createdAt - b.createdAt);

  const tail = sorted.slice(-SNAPSHOT_MAX_MESSAGES);
  const lines: ChatSnapshotLine[] = tail.map((m) => ({
    from: messageFromReporter(m, input.threadId, input.viewerTabId)
      ? "reportante"
      : "reportado",
    body: m.body.trim(),
    at: m.createdAt,
  }));

  let json = JSON.stringify(lines);
  if (json.length > SNAPSHOT_JSON_MAX) {
    const reduced = lines.slice(-Math.floor(SNAPSHOT_MAX_MESSAGES / 2));
    json = JSON.stringify(reduced);
  }

  const snippetLines = tail.slice(-8).map((m) => {
    const who = messageFromReporter(m, input.threadId, input.viewerTabId)
      ? "Reportante"
      : "Reportado";
    const text = m.body.trim().replace(/\s+/g, " ");
    const short = text.length > 160 ? `${text.slice(0, 160)}…` : text;
    return `${who}: ${short}`;
  });
  let chatSnippet = snippetLines.join("\n");
  if (chatSnippet.length > SNIPPET_MAX) {
    chatSnippet = `${chatSnippet.slice(0, SNIPPET_MAX)}…`;
  }
  if (!chatSnippet) {
    chatSnippet = "(Sin mensajes en el hilo al momento del reporte.)";
  }

  return { chatSnippet, chatSnapshotJson: json };
}
