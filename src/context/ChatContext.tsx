"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { analyzeChatMessage, type ChatGuardEvent } from "@/lib/chatMessageGuard";
import {
  getThreadViolationState,
  isThreadChatLocked,
  recordChatInfraction,
} from "@/lib/chatThreadViolations";

const STORAGE_KEY = "vibe:chat:v2";
const BC_NAME = "vibe-chat-v1";

export type ChatThread = {
  id: string;
  /** Id estable del otro usuario (demo; para reportes y Supabase). */
  partnerUserId?: string;
  partnerName: string;
  partnerRole: "Vendedor" | "Comprador";
  listingTitle: string;
  updatedAt: number;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  body: string;
  createdAt: number;
  /** Identificador de pestaña/dispositivo local para alinear “tú” vs “ellos”. */
  originTabId: string;
  /** Demo: fuerza alineación en mensajes semilla (comprador vs vendedor). */
  seedAlign?: "left" | "right";
};

type StoredState = {
  threads: ChatThread[];
  messages: ChatMessage[];
};

const INITIAL_THREADS: ChatThread[] = [
  {
    id: "th_maria",
    partnerUserId: "usr_maria_g",
    partnerName: "María G.",
    partnerRole: "Vendedor",
    listingTitle: "Chaqueta denim vintage",
    updatedAt: Date.now() - 3_400_000,
  },
  {
    id: "th_vintage",
    partnerUserId: "usr_vintage_cr",
    partnerName: "Vintage CR",
    partnerRole: "Vendedor",
    listingTitle: "Sudadera oversize gris",
    updatedAt: Date.now() - 80_000_000,
  },
];

function seedMessages(): ChatMessage[] {
  const t = Date.now();
  return [
    {
      id: "m_seed_1",
      threadId: "th_maria",
      body: "¡Hola! ¿La chaqueta sigue disponible en talla M?",
      createdAt: t - 3_500_000,
      originTabId: "seed",
      seedAlign: "right",
    },
    {
      id: "m_seed_2",
      threadId: "th_maria",
      body: "Sí, está disponible. ¿Te sirve envío por Correos?",
      createdAt: t - 3_400_000,
      originTabId: "seed",
      seedAlign: "left",
    },
    {
      id: "m_seed_3",
      threadId: "th_vintage",
      body: "¿El envío incluye guía de Correos desde el inicio?",
      createdAt: t - 80_000_000,
      originTabId: "seed",
      seedAlign: "right",
    },
    {
      id: "m_seed_4",
      threadId: "th_maria",
      body: "Si preferís coordinamos por whatsapp para resolver más rápido.",
      createdAt: t - 3_300_000,
      originTabId: "seed",
      seedAlign: "left",
    },
  ];
}

function loadState(): StoredState {
  if (typeof window === "undefined") {
    return { threads: INITIAL_THREADS, messages: seedMessages() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { threads: INITIAL_THREADS, messages: seedMessages() };
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed?.threads?.length) return { threads: INITIAL_THREADS, messages: seedMessages() };
    return {
      threads: parsed.threads,
      messages: Array.isArray(parsed.messages) ? parsed.messages : seedMessages(),
    };
  } catch {
    return { threads: INITIAL_THREADS, messages: seedMessages() };
  }
}

type ChatContextValue = {
  isReady: boolean;
  threads: ChatThread[];
  messages: ChatMessage[];
  guardEvent: ChatGuardEvent | null;
  clearGuardEvent: () => void;
  sendMessage: (threadId: string, body: string) => boolean;
  reportBlockedImagePaste: (threadId: string) => void;
  tabId: string;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [tabId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : "tab-client",
  );

  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_THREADS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [guardEvent, setGuardEvent] = useState<ChatGuardEvent | null>(null);

  useEffect(() => {
    const s = loadState();
    queueMicrotask(() => {
      setThreads(s.threads);
      setMessages(s.messages);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: StoredState = { threads, messages };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [threads, messages, hydrated]);

  const mergeMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg].sort((a, b) => a.createdAt - b.createdAt);
    });
    setThreads((prev) =>
      prev.map((t) =>
        t.id === msg.threadId ? { ...t, updatedAt: msg.createdAt } : t,
      ),
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const bc = new BroadcastChannel(BC_NAME);
    bc.onmessage = (event: MessageEvent<{ type: string; message?: ChatMessage }>) => {
      if (event.data?.type === "append" && event.data.message) {
        mergeMessage(event.data.message);
      }
    };
    return () => bc.close();
  }, [mergeMessage]);

  const bcRef = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    bcRef.current = new BroadcastChannel(BC_NAME);
    return () => {
      bcRef.current?.close();
      bcRef.current = null;
    };
  }, []);

  const clearGuardEvent = useCallback(() => setGuardEvent(null), []);

  const reportBlockedImagePaste = useCallback((threadId: string) => {
    recordChatInfraction(threadId);
    if (isThreadChatLocked(threadId)) {
      setGuardEvent({
        type: "thread_locked",
        until: getThreadViolationState(threadId).lockUntil,
      });
    } else {
      setGuardEvent({ type: "blocked_image" });
    }
  }, []);

  const sendMessage = useCallback(
    (threadId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return false;

      if (isThreadChatLocked(threadId)) {
        setGuardEvent({
          type: "thread_locked",
          until: getThreadViolationState(threadId).lockUntil,
        });
        return false;
      }

      const check = analyzeChatMessage(trimmed);
      if (!check.allowed) {
        recordChatInfraction(threadId);
        if (isThreadChatLocked(threadId)) {
          setGuardEvent({
            type: "thread_locked",
            until: getThreadViolationState(threadId).lockUntil,
          });
        } else {
          setGuardEvent({
            type: "blocked_text",
            category: check.category,
          });
        }
        return false;
      }

      setGuardEvent(null);

      const msg: ChatMessage = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `m-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        threadId,
        body: trimmed,
        createdAt: Date.now(),
        originTabId: tabId,
      };

      mergeMessage(msg);
      bcRef.current?.postMessage({ type: "append", message: msg });
      return true;
    },
    [mergeMessage, tabId],
  );

  const sortedThreads = useMemo(
    () => [...threads].sort((a, b) => b.updatedAt - a.updatedAt),
    [threads],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      isReady: hydrated,
      threads: sortedThreads,
      messages,
      guardEvent,
      clearGuardEvent,
      sendMessage,
      reportBlockedImagePaste,
      tabId,
    }),
    [
      hydrated,
      sortedThreads,
      messages,
      guardEvent,
      clearGuardEvent,
      sendMessage,
      reportBlockedImagePaste,
      tabId,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat debe usarse dentro de ChatProvider");
  return ctx;
}
