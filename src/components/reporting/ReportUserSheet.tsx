"use client";

import { textWithBrandItalic } from "@/components/branding/BrandName";
import type { ChatMessage } from "@/context/ChatContext";
import { submitUserReportWithChatPanic } from "@/lib/moderationChatSubmit";
import {
  submitUserReport,
  USER_REPORT_REASON_LABELS,
  type UserReportReason,
} from "@/lib/userReports";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";

const REASON_ORDER: UserReportReason[] = [
  "negotiate_outside",
  "contact_leak",
  "wrong_category",
  "abuse_scam",
];

const ALERT = "#FF4B4B";
const BG = "#1A1A1A";
const SHEET = "#242424";

type Props = {
  open: boolean;
  onClose: () => void;
  reportedId: string;
  reportedDisplayName: string;
  contextChatId?: string | null;
  /** Escaneo automático de los últimos mensajes del interlocutor (solo chat). */
  panicScan?: {
    messages: readonly ChatMessage[];
    threadId: string;
    viewerTabId: string;
  } | null;
};

export function ReportUserSheet({
  open,
  onClose,
  reportedId,
  reportedDisplayName,
  contextChatId = null,
  panicScan = null,
}: Props) {
  const formId = useId();
  const [reason, setReason] = useState<UserReportReason | null>(null);
  const [comments, setComments] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setReason(null);
      setComments("");
      setSending(false);
      setDone(false);
    }
  }, [open]);

  const submit = async () => {
    if (!reason || sending) return;
    setSending(true);
    try {
      if (panicScan && contextChatId) {
        await submitUserReportWithChatPanic({
          reported_id: reportedId,
          reason,
          comments,
          context_chat_id: contextChatId,
          panicScan: {
            messages: panicScan.messages,
            threadId: panicScan.threadId,
            viewerTabId: panicScan.viewerTabId,
          },
        });
      } else {
        await submitUserReport({
          reported_id: reportedId,
          reason,
          comments,
          context_chat_id: contextChatId,
        });
      }
    } finally {
      setSending(false);
      setDone(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[85] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${formId}-report-title`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
            aria-label="Cerrar"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 max-h-[min(85dvh,36rem)] overflow-hidden rounded-t-3xl border border-white/[0.1] shadow-[0_-16px_48px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: SHEET }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div
              className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3"
              style={{ backgroundColor: BG }}
            >
              <h2
                id={`${formId}-report-title`}
                className="text-base font-semibold"
                style={{ color: ALERT }}
              >
                Reportar usuario
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Cerrar"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>

            <div
              className="max-h-[min(68dvh,28rem)] overflow-y-auto overscroll-y-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
              style={{ backgroundColor: BG }}
            >
              <p className="text-xs text-zinc-500">
                Usuario reportado:{" "}
                <span className="font-medium text-zinc-300">
                  {reportedDisplayName}
                </span>
              </p>
              {contextChatId ? (
                <p className="mt-1 text-[10px] text-zinc-600">
                  Contexto: conversación{" "}
                  <span className="font-mono text-zinc-500">{contextChatId}</span>
                </p>
              ) : null}

              <p
                className="mt-4 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: ALERT }}
              >
                Motivo del reporte
              </p>
              <ul className="mt-2 space-y-1.5">
                {REASON_ORDER.map((r) => {
                  const active = reason === r;
                  const { detail } = USER_REPORT_REASON_LABELS[r];
                  return (
                    <li key={r}>
                      <button
                        type="button"
                        onClick={() => setReason(r)}
                        className={`flex w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
                          active
                            ? "border-violet-electric/60 bg-violet-electric/15 text-white"
                            : "border-white/[0.08] bg-[#242424] text-zinc-300 hover:border-white/15"
                        }`}
                      >
                        <span className="font-medium" style={{ color: ALERT }}>
                          {detail}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <label
                htmlFor={`${formId}-comments`}
                className="mt-5 block text-xs font-medium text-zinc-400"
              >
                Comentarios (opcional)
              </label>
              <textarea
                id={`${formId}-comments`}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Detalles adicionales para el equipo de moderación…"
                className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-[#242424] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-electric/40"
              />

              {done ? (
                <p
                  className="mt-4 text-center text-sm font-medium leading-relaxed text-zinc-300"
                  role="status"
                >
                  {textWithBrandItalic(
                    "Reporte enviado. Gracias por ayudar a mantener De Mano en Mano seguro.",
                  )}
                </p>
              ) : (
                <button
                  type="button"
                  disabled={!reason || sending}
                  onClick={() => void submit()}
                  className="mt-5 w-full rounded-2xl border border-white/15 bg-[#1A1A1A] py-3.5 text-sm font-semibold transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ color: ALERT }}
                >
                  {sending ? "Enviando…" : "Enviar reporte"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
