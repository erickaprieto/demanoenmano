"use client";

import { ChatGuardModal } from "@/components/chat/ChatGuardModal";
import { useChat, type ChatMessage } from "@/context/ChatContext";
import type { ChatBlockCategory } from "@/lib/chatMessageGuard";
import { scanChatDraft } from "@/lib/chatMessageGuard";
import { CHAT_SECURITY_NOTICE } from "@/lib/patternBlocker";
import { isThreadChatLocked } from "@/lib/chatThreadViolations";
import { ReportUserSheet } from "@/components/reporting/ReportUserSheet";
import { ArrowLeft, MoreVertical, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const CHAT_TRUST_REMINDER =
  "Para tu seguridad, usa las fotos y videos de la publicación original. No se permite el envío de archivos externos. El envío de contacto o archivos externos está prohibido y genera el bloqueo inmediato del perfil.";

function formatTime(ts: number) {
  return new Intl.DateTimeFormat("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function threadPreview(
  threadId: string,
  messages: Pick<ChatMessage, "threadId" | "body" | "createdAt">[],
) {
  const list = messages.filter((m) => m.threadId === threadId);
  if (!list.length) return "";
  const last = list.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b));
  const t = last.body.trim();
  return t.length > 56 ? `${t.slice(0, 56)}…` : t;
}

function draftHotLabel(c: ChatBlockCategory): string {
  if (c === "barter")
    return "No se permiten intercambios ni trueque en el chat.";
  if (c === "negotiation")
    return "Los precios son fijos: no negociación ni descuentos por mensaje.";
  return "No compartas contacto, pagos fuera de De Mano en Mano ni citas en persona.";
}

export function MessagesClient() {
  const searchParams = useSearchParams();
  const {
    isReady,
    threads,
    messages,
    guardEvent,
    clearGuardEvent,
    sendMessage,
    reportBlockedImagePaste,
    tabId,
  } = useChat();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [, setViolTick] = useState(0);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const draftScan = useMemo(() => scanChatDraft(draft), [draft]);
  const draftBlocked = !draftScan.allowed;
  const draftHot: ChatBlockCategory | null = draftScan.allowed
    ? null
    : draftScan.category;

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) ?? null,
    [threads, activeId],
  );

  const threadMessages = useMemo(() => {
    if (!activeId) return [];
    return messages
      .filter((m) => m.threadId === activeId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [messages, activeId]);

  const locked = Boolean(
    activeThread && isThreadChatLocked(activeThread.id),
  );

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages.length, activeId]);

  useEffect(() => {
    const on = () => setViolTick((n) => n + 1);
    window.addEventListener("vibe-chat-violations-updated", on);
    return () => window.removeEventListener("vibe-chat-violations-updated", on);
  }, []);

  useEffect(() => {
    if (!chatMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (
        chatMenuRef.current &&
        !chatMenuRef.current.contains(e.target as Node)
      ) {
        setChatMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [chatMenuOpen]);

  useEffect(() => {
    queueMicrotask(() => {
      setChatMenuOpen(false);
      setReportOpen(false);
    });
  }, [activeId]);

  useEffect(() => {
    const tid = searchParams.get("thread");
    if (!tid) return;
    if (!threads.some((th) => th.id === tid)) return;
    queueMicrotask(() => setActiveId(tid));
  }, [searchParams, threads]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!activeThread) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          e.preventDefault();
          reportBlockedImagePaste(activeThread.id);
          return;
        }
      }
    },
    [activeThread, reportBlockedImagePaste],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!activeThread) return;
      if (e.dataTransfer?.files?.length) {
        e.preventDefault();
        reportBlockedImagePaste(activeThread.id);
      }
    },
    [activeThread, reportBlockedImagePaste],
  );

  if (!isReady) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4">
        <div className="size-9 animate-pulse rounded-full bg-zinc-800" />
        <p className="text-sm text-zinc-500">Cargando conversaciones…</p>
      </div>
    );
  }

  if (activeThread) {
    const inputRing =
      draftBlocked && !locked
        ? "border-orange-500/80 shadow-[0_0_0_1px_rgba(249,115,22,0.45)] ring-2 ring-orange-500/35 animate-pulse"
        : "border-white/10 focus:border-violet-electric/50 focus:ring-1 focus:ring-violet-electric/30";

    return (
      <div
        className="flex min-h-[calc(100dvh-8rem)] flex-col"
        style={{ backgroundColor: "#1A1A1A" }}
      >
        <ChatGuardModal open={guardEvent} onClose={clearGuardEvent} />
        <ReportUserSheet
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reportedId={activeThread.partnerUserId ?? activeThread.id}
          reportedDisplayName={activeThread.partnerName}
          contextChatId={activeThread.id}
          panicScan={{
            messages,
            threadId: activeThread.id,
            viewerTabId: tabId,
          }}
        />

        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/[0.08] bg-[#1A1A1A]/95 px-2 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setActiveId(null);
              setDraft("");
              setChatMenuOpen(false);
              setReportOpen(false);
              clearGuardEvent();
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Volver a la lista"
          >
            <ArrowLeft className="size-5" strokeWidth={2} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {activeThread.partnerName}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {activeThread.partnerRole} · {activeThread.listingTitle}
            </p>
          </div>
          <div className="relative shrink-0" ref={chatMenuRef}>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Más opciones"
              aria-expanded={chatMenuOpen}
              aria-haspopup="menu"
              onClick={() => setChatMenuOpen((o) => !o)}
            >
              <MoreVertical className="size-5" strokeWidth={2} />
            </button>
            {chatMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-white/10 bg-[#242424] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.06]"
              >
                <button
                  role="menuitem"
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-white/[0.06]"
                  style={{ color: "#FF4B4B" }}
                  onClick={() => {
                    setChatMenuOpen(false);
                    setReportOpen(true);
                  }}
                >
                  Reportar usuario
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {threadMessages.map((m) => {
            const mine =
              m.seedAlign != null ? m.seedAlign === "right" : m.originTabId === tabId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    mine
                      ? "bg-violet-electric/90 text-white shadow-[0_0_24px_-8px_rgba(138,43,226,0.5)]"
                      : "bg-[#242424] text-zinc-100 ring-1 ring-white/[0.06]"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`mt-1 text-[10px] tabular-nums ${
                      mine ? "text-white/70" : "text-zinc-500"
                    }`}
                  >
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={listEndRef} />
        </div>

        <div
          className="sticky bottom-0 border-t border-white/[0.08] bg-[#1A1A1A]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <p className="mb-2 rounded-lg border border-white/[0.08] bg-[#242424]/90 px-2.5 py-2 text-[10px] leading-snug text-zinc-400 ring-1 ring-white/[0.04]">
            {CHAT_TRUST_REMINDER}
          </p>
          {locked ? (
            <p
              className="mb-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs leading-relaxed text-amber-100"
              role="status"
            >
              Chat restringido por reiteradas infracciones. Volvé a intentar más
              tarde.
            </p>
          ) : null}
          {draftBlocked && !locked ? (
            <div
              className="mb-2 space-y-1.5 rounded-xl border border-orange-500/45 bg-orange-500/10 px-3 py-2 shadow-[0_0_20px_-8px_rgba(249,115,22,0.35)]"
              role="alert"
            >
              <p className="text-xs font-semibold leading-snug text-orange-100">
                {draftHot ? draftHotLabel(draftHot) : "Contenido no permitido"}
              </p>
              <p className="text-[11px] leading-relaxed text-violet-200/95">
                {CHAT_SECURITY_NOTICE}
              </p>
            </div>
          ) : null}
          <form
            className="flex w-full items-stretch gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (locked || draftBlocked) return;
              const ok = sendMessage(activeThread.id, draft);
              if (ok) setDraft("");
            }}
          >
            <label htmlFor="chat-draft" className="sr-only">
              Escribí un mensaje
            </label>
            <textarea
              id="chat-draft"
              rows={1}
              value={draft}
              disabled={locked}
              onChange={(e) => {
                setDraft(e.target.value);
                if (guardEvent) clearGuardEvent();
              }}
              onPaste={handlePaste}
              placeholder={
                locked
                  ? "Conversación restringida temporalmente…"
                  : "Mensaje de texto solo (sin archivos ni contacto)…"
              }
              className={`max-h-32 min-h-[44px] min-w-0 w-full flex-1 resize-none rounded-2xl bg-[#242424] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 ${inputRing}`}
            />
            <button
              type="submit"
              disabled={!draft.trim() || locked || draftBlocked}
              style={{ backgroundColor: "#8A2BE2" }}
              className="flex size-11 shrink-0 items-center justify-center self-end rounded-2xl text-white shadow-[0_0_20px_-6px_rgba(138,43,226,0.55)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Enviar mensaje"
            >
              <Send className="size-5" strokeWidth={2} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ChatGuardModal open={guardEvent} onClose={clearGuardEvent} />
      <p className="text-sm text-zinc-500">
        Abrí otra pestaña con De Mano en Mano para ver los mensajes aparecer al instante
        (misma cuenta, demo local).
      </p>
      <ul className="mt-4 space-y-2">
        {threads.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => {
                setActiveId(t.id);
                setDraft("");
                clearGuardEvent();
              }}
              className="flex w-full flex-col gap-1 rounded-2xl bg-obsidian-elevated px-4 py-3.5 text-left ring-1 ring-white/[0.06] transition hover:ring-violet-electric/25"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold text-white">
                  {t.partnerName}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-zinc-600">
                  {formatTime(t.updatedAt)}
                </span>
              </div>
              <span className="truncate text-xs text-zinc-500">
                {t.listingTitle}
              </span>
              <span className="line-clamp-2 text-xs text-zinc-400">
                {threadPreview(t.id, messages) || "Sin mensajes aún"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
