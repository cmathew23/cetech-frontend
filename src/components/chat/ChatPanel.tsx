"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getChatMessages, parseChatMessage, type ChatMessage } from "@/lib/api/chat";
import { getChatSocket } from "@/lib/chatSocket";
import { requestChatUnreadRefresh } from "@/hooks/useChatUnreadCount";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { DASHBOARD_CARD_TITLE_CLASS } from "@/components/dashboard/shared/dashboardTypography";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const MAX_MESSAGE_LENGTH = 4000;
const HIDDEN_HISTORY_TEXT =
  "Messages older than 96 hours are hidden from this chat view.";

type ChatPanelProps = {
  conversationId: string;
  athleteName: string;
  coachName: string;
  currentUserRole: "ATHLETE" | "COACH";
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function mergeUniqueMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const message of current) {
    byId.set(message.id, message);
  }
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return a.id.localeCompare(b.id);
    if (Number.isNaN(aTime)) return -1;
    if (Number.isNaN(bTime)) return 1;
    if (aTime !== bTime) return aTime - bTime;
    return a.id.localeCompare(b.id);
  });
}

export function ChatPanel({
  conversationId,
  athleteName,
  coachName,
  currentUserRole,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const draftError = useMemo(() => {
    const trimmed = draft.trim();
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`;
    }
    return null;
  }, [draft]);

  const appendMessages = useCallback((incoming: ChatMessage[]) => {
    setMessages((current) => mergeUniqueMessages(current, incoming));
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const history = await getChatMessages(conversationId);
        if (cancelled) return;
        setMessages(history);
        requestChatUnreadRefresh();
      } catch (error) {
        if (cancelled) return;
        setMessages([]);
        setHistoryError(
          error instanceof Error
            ? error.message
            : "Could not load message history. Try again shortly.",
        );
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    let socket: Socket;
    try {
      socket = getChatSocket();
      setSocketError(null);
    } catch (error) {
      setSocketError(error instanceof Error ? error.message : "Could not connect to chat.");
      return;
    }

    const handleMessage = (payload: unknown) => {
      const parsed = parseChatMessage(payload);
      if (!parsed || parsed.conversationId !== conversationId) return;
      appendMessages([parsed]);
      setSending(false);
    };

    const handleConnectError = (error: Error) => {
      setSocketError(error.message || "Chat connection failed.");
      setSending(false);
    };

    const handleDisconnect = () => {
      setSocketError("Chat disconnected. Reconnect by refreshing or trying again.");
      setSending(false);
    };

    socket.on("chat:message", handleMessage);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("chat:join", { conversationId });

    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
    };
  }, [appendMessages, conversationId]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed === "" || trimmed.length > MAX_MESSAGE_LENGTH) return;

    let socket: Socket;
    try {
      socket = getChatSocket();
      setSocketError(null);
    } catch (error) {
      setSocketError(error instanceof Error ? error.message : "Could not connect to chat.");
      return;
    }

    setSending(true);
    try {
      socket.emit("chat:send", {
        conversationId,
        content: trimmed,
      });
      setDraft("");
    } catch (error) {
      setSocketError(error instanceof Error ? error.message : "Could not send message.");
      setSending(false);
    }
  }, [conversationId, draft]);

  return (
    <Card
      accent={false}
      className={cn("space-y-4", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
      title="Conversation"
      subtitle="Text-only chat for coach-athlete communication."
      titleClassName={DASHBOARD_CARD_TITLE_CLASS}
    >
      <div className="space-y-1">
        <p className="text-sm font-normal text-textPrimary">Coach: {coachName || "—"}</p>
        <p className="text-sm font-normal text-textPrimary">Athlete: {athleteName || "—"}</p>
      </div>

      <p className="text-sm text-textSecondary">{HIDDEN_HISTORY_TEXT}</p>

      {historyError ? <Alert variant="danger">{historyError}</Alert> : null}
      {socketError ? <Alert variant="danger">{socketError}</Alert> : null}

      <div
        ref={messagesRef}
        className="max-h-[28rem] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3"
      >
        {historyLoading ? (
          <p className="text-sm text-slate-500">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet.</p>
        ) : (
          messages.map((message) => {
            const isOwnMessage =
              message.senderRoleSnapshot.trim().toUpperCase() === currentUserRole;
            const timestamp = formatTimestamp(message.createdAt);
            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  isOwnMessage ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                    isOwnMessage
                      ? "bg-primary text-white"
                      : "border border-slate-200 bg-white text-slate-900",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                  {timestamp ? (
                    <p
                      className={cn(
                        "mt-2 text-[11px]",
                        isOwnMessage ? "text-white/80" : "text-slate-500",
                      )}
                    >
                      {timestamp}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="chat-message" className="text-sm font-normal text-textPrimary">
          Message
        </label>
        <textarea
          id="chat-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-primary/35 focus-visible:ring-2"
          placeholder="Type a message"
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {draftError ? (
              <p className="text-sm text-danger" role="alert">
                {draftError}
              </p>
            ) : null}
            <p className="text-xs text-textSecondary">
              {draft.trim().length}/{MAX_MESSAGE_LENGTH} characters
            </p>
          </div>
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || draft.trim() === "" || draftError !== null}
          >
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
