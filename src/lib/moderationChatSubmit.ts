import { pushAdminModerationAlert } from "@/lib/adminModerationQueue";
import type { ChatMessage } from "@/context/ChatContext";
import { buildChatReportSnapshot } from "@/lib/chatReportSnapshot";
import { scanReportedUserLastMessages } from "@/lib/chatPanicScan";
import { getOrCreateDemoUserId } from "@/lib/demoUserId";
import {
  applyClientShadowBanForReportedUser,
  broadcastCriticalAccountReview,
} from "@/lib/moderationShadowBan";
import {
  submitUserReport,
  type UserReportPayload,
  type UserReportReason,
} from "@/lib/userReports";

export type ChatPanicSubmitInput = {
  reported_id: string;
  reason: UserReportReason;
  comments: string;
  context_chat_id: string | null;
  reporter_id?: string;
  panicScan:
    | {
        messages: readonly ChatMessage[];
        threadId: string;
        viewerTabId: string;
      }
    | undefined
    | null;
};

export type ChatPanicSubmitResult = {
  severity: "standard" | "critical";
  autoScanHitCount: number;
};

function absoluteChatLogUrl(contextChatId: string | null): string {
  const path =
    contextChatId != null
      ? `/mensajes?thread=${encodeURIComponent(contextChatId)}`
      : "/mensajes";
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export async function submitUserReportWithChatPanic(
  input: ChatPanicSubmitInput,
): Promise<ChatPanicSubmitResult> {
  const {
    panicScan,
    context_chat_id,
    reported_id,
    reason,
    comments,
    reporter_id,
  } = input;

  let severity: "standard" | "critical" = "standard";
  let autoScanHitCount = 0;

  if (
    panicScan &&
    context_chat_id &&
    panicScan.threadId === context_chat_id
  ) {
    const scan = scanReportedUserLastMessages(
      panicScan.messages,
      panicScan.threadId,
      panicScan.viewerTabId,
      10,
    );
    autoScanHitCount = scan.hitCount;
    if (scan.severity === "critical") {
      severity = "critical";
    }
  }

  const reporter = reporter_id ?? getOrCreateDemoUserId();

  let chat_snippet: string | null = null;
  let chat_snapshot_json: string | null = null;
  if (panicScan && context_chat_id && panicScan.threadId === context_chat_id) {
    const snap = buildChatReportSnapshot({
      messages: panicScan.messages,
      threadId: context_chat_id,
      viewerTabId: panicScan.viewerTabId,
    });
    chat_snippet = snap.chatSnippet;
    chat_snapshot_json = snap.chatSnapshotJson;
  }

  const payload: Omit<UserReportPayload, "reporter_id"> & {
    reporter_id?: string;
    severity?: UserReportPayload["severity"];
    auto_scan_hit_count?: number;
  } = {
    reported_id,
    reason,
    comments,
    context_chat_id,
    reporter_id,
    severity,
    auto_scan_hit_count: autoScanHitCount,
    chat_snippet,
    chat_snapshot_json,
  };

  if (severity === "critical") {
    const chatLogUrl = absoluteChatLogUrl(context_chat_id);

    try {
      await fetch("/api/moderation/shadow-ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reported_user_id: reported_id }),
      });
    } catch {
      /* continuar con acciones locales */
    }

    try {
      await fetch("/api/moderation/admin-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          severity,
          chat_log_url: chatLogUrl,
          reported_id,
          reporter_id: reporter,
          reason,
          context_chat_id,
          auto_scan_hit_count: autoScanHitCount,
        }),
      });
    } catch {
      /* cola local abajo */
    }

    applyClientShadowBanForReportedUser(reported_id);
    broadcastCriticalAccountReview(reported_id);

    pushAdminModerationAlert({
      severity,
      chatLogUrl,
      reportedId: reported_id,
      reporterId: reporter,
      reason,
      contextChatId: context_chat_id,
      autoScanHitCount,
    });
  }

  await submitUserReport(payload);

  return { severity, autoScanHitCount };
}
