"use client";

import { useEffect, useState } from "react";
import { getOrCreateDemoUserId } from "@/lib/demoUserId";
import {
  applyAccountReviewLockIfSelf,
  clearAccountReviewLock,
  mergeHiddenSellerIdsFromBroadcast,
  readAccountReviewMessage,
} from "@/lib/moderationShadowBan";

const BC_NAME = "vibe-moderation-v1";

export function ModerationAccountGate() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const initial = readAccountReviewMessage();
      if (initial) {
        setMessage(initial);
        setOpen(true);
      }
    });
    const onLock = () => {
      setMessage(readAccountReviewMessage());
      setOpen(true);
    };
    const onClear = () => {
      setOpen(false);
      setMessage(null);
    };
    window.addEventListener("vibe-account-under-review", onLock);
    window.addEventListener("vibe-account-review-cleared", onClear);
    return () => {
      window.removeEventListener("vibe-account-under-review", onLock);
      window.removeEventListener("vibe-account-review-cleared", onClear);
    };
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(BC_NAME);
    bc.onmessage = (ev: MessageEvent) => {
      const d = ev.data as {
        type?: string;
        reportedUserId?: string;
        hiddenSellerIds?: string[];
      };
      if (d?.type === "shadow_ban" && Array.isArray(d.hiddenSellerIds)) {
        mergeHiddenSellerIdsFromBroadcast(d.hiddenSellerIds);
      }
      if (d?.type === "account_under_review" && d.reportedUserId) {
        applyAccountReviewLockIfSelf(d.reportedUserId);
        if (getOrCreateDemoUserId() === d.reportedUserId) {
          setMessage(readAccountReviewMessage());
          setOpen(true);
        }
      }
    };
    return () => bc.close();
  }, []);

  if (!open || !message) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="account-review-title"
    >
      <p
        id="account-review-title"
        className="max-w-sm text-lg font-semibold leading-snug text-white"
      >
        {message}
      </p>
      <p className="mt-4 max-w-xs text-sm text-zinc-500">
        Si creés que es un error, contactá a soporte desde otro dispositivo con
        tu información de cuenta.
      </p>
      <button
        type="button"
        onClick={() => {
          clearAccountReviewLock();
          setOpen(false);
          setMessage(null);
        }}
        className="mt-10 rounded-2xl border border-white/15 bg-[#1A1A1A] px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/25"
      >
        Entendido (modo demo)
      </button>
    </div>
  );
}
