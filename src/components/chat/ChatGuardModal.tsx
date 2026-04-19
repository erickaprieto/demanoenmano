"use client";

import { CHAT_MODAL_COPY, type ChatGuardEvent } from "@/lib/chatMessageGuard";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

type Props = {
  open: ChatGuardEvent | null;
  onClose: () => void;
};

function modalCopy(open: ChatGuardEvent): {
  title: string;
  body: string;
} {
  if (open.type === "blocked_text") {
    return CHAT_MODAL_COPY[open.category];
  }
  if (open.type === "blocked_image") {
    return {
      title: "Fotos no permitidas en el chat",
      body: "Por tu seguridad, mantén el contacto y el pago dentro de la app. No compartas imágenes que puedan incluir teléfonos, SINPE o códigos QR.",
    };
  }
  return {
    title: "Chat restringido temporalmente",
    body: `Superaste los intentos no permitidos en esta conversación. Podrás escribir de nuevo después del ${new Intl.DateTimeFormat("es-CR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(open.until))}.`,
  };
}

export function ChatGuardModal({ open, onClose }: Props) {
  const copy = open ? modalCopy(open) : null;

  return (
    <AnimatePresence>
      {open && copy ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            aria-label="Cerrar"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-guard-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative z-10 m-4 w-full max-w-sm rounded-2xl border border-violet-electric/40 bg-[#1A1A1A] p-5 shadow-[0_0_48px_-12px_rgba(138,43,226,0.55)]"
          >
            <div className="flex gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-electric/20 text-violet-electric ring-1 ring-violet-electric/35">
                <ShieldAlert className="size-6" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="chat-guard-title"
                  className="text-base font-semibold leading-snug text-violet-200"
                >
                  {copy.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  {copy.body}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-violet-electric py-3 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(138,43,226,0.5)] transition hover:brightness-110"
            >
              Entendido
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
